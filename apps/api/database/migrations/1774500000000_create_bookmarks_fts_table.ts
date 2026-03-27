import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Standalone FTS5 virtual table indexing bookmark text fields.
    // Sync is managed entirely by triggers (no content= directive).
    this.schema.raw(`
      CREATE VIRTUAL TABLE IF NOT EXISTS bookmarks_fts USING fts5(
        title,
        description,
        summary,
        plain_text,
        tags,
        tokenize='porter unicode61'
      );
    `)

    // Populate FTS index from existing bookmarks
    this.schema.raw(`
      INSERT INTO bookmarks_fts(rowid, title, description, summary, plain_text, tags)
      SELECT
        b.id,
        COALESCE(b.title, ''),
        COALESCE(b.description, ''),
        COALESCE(b.summary, ''),
        COALESCE(b.plain_text, ''),
        COALESCE(
          (SELECT GROUP_CONCAT(t.name, ' ')
           FROM tags t
           JOIN bookmark_tags bt ON bt.tag_id = t.id
           WHERE bt.bookmark_id = b.id),
          ''
        )
      FROM bookmarks b;
    `)

    // Trigger: keep FTS in sync on INSERT
    // Tags intentionally empty: bookmarks_fts_tag_insert trigger handles FTS sync
    // when tags are associated after bookmark creation.
    this.schema.raw(`
      CREATE TRIGGER IF NOT EXISTS bookmarks_fts_insert
      AFTER INSERT ON bookmarks
      BEGIN
        INSERT INTO bookmarks_fts(rowid, title, description, summary, plain_text, tags)
        VALUES (
          NEW.id,
          COALESCE(NEW.title, ''),
          COALESCE(NEW.description, ''),
          COALESCE(NEW.summary, ''),
          COALESCE(NEW.plain_text, ''),
          ''
        );
      END;
    `)

    // Trigger: keep FTS in sync on UPDATE
    this.schema.raw(`
      CREATE TRIGGER IF NOT EXISTS bookmarks_fts_update
      AFTER UPDATE ON bookmarks
      BEGIN
        DELETE FROM bookmarks_fts WHERE rowid = OLD.id;
        INSERT INTO bookmarks_fts(rowid, title, description, summary, plain_text, tags)
        VALUES (
          NEW.id,
          COALESCE(NEW.title, ''),
          COALESCE(NEW.description, ''),
          COALESCE(NEW.summary, ''),
          COALESCE(NEW.plain_text, ''),
          COALESCE(
            (SELECT GROUP_CONCAT(t.name, ' ')
             FROM tags t
             JOIN bookmark_tags bt ON bt.tag_id = t.id
             WHERE bt.bookmark_id = NEW.id),
            ''
          )
        );
      END;
    `)

    // Trigger: keep FTS in sync on DELETE
    this.schema.raw(`
      CREATE TRIGGER IF NOT EXISTS bookmarks_fts_delete
      AFTER DELETE ON bookmarks
      BEGIN
        DELETE FROM bookmarks_fts WHERE rowid = OLD.id;
      END;
    `)

    // Trigger: rebuild FTS entry when tags are added to a bookmark
    this.schema.raw(`
      CREATE TRIGGER IF NOT EXISTS bookmarks_fts_tag_insert
      AFTER INSERT ON bookmark_tags
      BEGIN
        DELETE FROM bookmarks_fts WHERE rowid = NEW.bookmark_id;
        INSERT INTO bookmarks_fts(rowid, title, description, summary, plain_text, tags)
        VALUES (
          NEW.bookmark_id,
          COALESCE((SELECT title FROM bookmarks WHERE id = NEW.bookmark_id), ''),
          COALESCE((SELECT description FROM bookmarks WHERE id = NEW.bookmark_id), ''),
          COALESCE((SELECT summary FROM bookmarks WHERE id = NEW.bookmark_id), ''),
          COALESCE((SELECT plain_text FROM bookmarks WHERE id = NEW.bookmark_id), ''),
          COALESCE(
            (SELECT GROUP_CONCAT(t.name, ' ')
             FROM tags t
             JOIN bookmark_tags bt ON bt.tag_id = t.id
             WHERE bt.bookmark_id = NEW.bookmark_id),
            ''
          )
        );
      END;
    `)

    // Trigger: rebuild FTS entry when tags are removed from a bookmark.
    // Guard with EXISTS to prevent ghost FTS rows when bookmark is cascade-deleted.
    this.schema.raw(`
      CREATE TRIGGER IF NOT EXISTS bookmarks_fts_tag_delete
      AFTER DELETE ON bookmark_tags
      WHEN EXISTS (SELECT 1 FROM bookmarks WHERE id = OLD.bookmark_id)
      BEGIN
        DELETE FROM bookmarks_fts WHERE rowid = OLD.bookmark_id;
        INSERT INTO bookmarks_fts(rowid, title, description, summary, plain_text, tags)
        VALUES (
          OLD.bookmark_id,
          COALESCE((SELECT title FROM bookmarks WHERE id = OLD.bookmark_id), ''),
          COALESCE((SELECT description FROM bookmarks WHERE id = OLD.bookmark_id), ''),
          COALESCE((SELECT summary FROM bookmarks WHERE id = OLD.bookmark_id), ''),
          COALESCE((SELECT plain_text FROM bookmarks WHERE id = OLD.bookmark_id), ''),
          COALESCE(
            (SELECT GROUP_CONCAT(t.name, ' ')
             FROM tags t
             JOIN bookmark_tags bt ON bt.tag_id = t.id
             WHERE bt.bookmark_id = OLD.bookmark_id),
            ''
          )
        );
      END;
    `)
  }

  async down() {
    this.schema.raw('DROP TRIGGER IF EXISTS bookmarks_fts_tag_delete;')
    this.schema.raw('DROP TRIGGER IF EXISTS bookmarks_fts_tag_insert;')
    this.schema.raw('DROP TRIGGER IF EXISTS bookmarks_fts_delete;')
    this.schema.raw('DROP TRIGGER IF EXISTS bookmarks_fts_update;')
    this.schema.raw('DROP TRIGGER IF EXISTS bookmarks_fts_insert;')
    this.schema.raw('DROP TABLE IF EXISTS bookmarks_fts;')
  }
}
