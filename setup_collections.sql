-- Create templates collection
INSERT OR IGNORE INTO _collections (id, system, type, name, fields, listRule, viewRule, createRule, updateRule, deleteRule, options)
VALUES (
    'templates_col_id',
    0,
    'base',
    'templates',
    json('[
        {
            "id": "name_field",
            "name": "name",
            "type": "text",
            "required": true,
            "presentable": true,
            "unique": false,
            "options": {
                "min": null,
                "max": 255,
                "pattern": ""
            }
        },
        {
            "id": "template_content",
            "name": "template_content",
            "type": "editor",
            "required": true,
            "presentable": false,
            "unique": false,
            "options": {
                "exceptDomains": [],
                "convertUrls": false
            }
        },
        {
            "id": "placeholders_f",
            "name": "placeholders",
            "type": "json",
            "required": false,
            "presentable": false,
            "unique": false,
            "options": {
                "maxSize": 2000000
            }
        },
        {
            "id": "category_field",
            "name": "category",
            "type": "select",
            "required": true,
            "presentable": false,
            "unique": false,
            "options": {
                "maxSelect": 1,
                "values": [
                    "leistung",
                    "eignung",
                    "zuschlag",
                    "bedarf"
                ]
            }
        },
        {
            "id": "active_field",
            "name": "active",
            "type": "bool",
            "required": false,
            "presentable": false,
            "unique": false,
            "options": {}
        }
    ]'),
    '@request.auth.id != ""',
    '@request.auth.id != ""',
    '',
    '',
    '',
    json('{}')
);

-- Create bedarf collection
INSERT OR IGNORE INTO _collections (id, system, type, name, fields, listRule, viewRule, createRule, updateRule, deleteRule, options)
VALUES (
    'bedarf_col_id',
    0,
    'base',
    'bedarf',
    json('[
        {
            "id": "user_id_field",
            "name": "user_id",
            "type": "relation",
            "required": true,
            "presentable": false,
            "unique": false,
            "options": {
                "collectionId": "_pb_users_auth_",
                "cascadeDelete": true,
                "minSelect": null,
                "maxSelect": 1,
                "displayFields": null
            }
        },
        {
            "id": "project_field",
            "name": "project_id",
            "type": "relation",
            "required": false,
            "presentable": false,
            "unique": false,
            "options": {
                "collectionId": "projects_collection",
                "cascadeDelete": false,
                "minSelect": null,
                "maxSelect": 1,
                "displayFields": null
            }
        },
        {
            "id": "init_desc_field",
            "name": "initial_description",
            "type": "text",
            "required": true,
            "presentable": true,
            "unique": false,
            "options": {
                "min": null,
                "max": 5000,
                "pattern": ""
            }
        },
        {
            "id": "questions_field",
            "name": "questions",
            "type": "json",
            "required": false,
            "presentable": false,
            "unique": false,
            "options": {
                "maxSize": 2000000
            }
        },
        {
            "id": "answers_field",
            "name": "answers",
            "type": "json",
            "required": false,
            "presentable": false,
            "unique": false,
            "options": {
                "maxSize": 2000000
            }
        },
        {
            "id": "doc_data_field",
            "name": "document_data",
            "type": "json",
            "required": false,
            "presentable": false,
            "unique": false,
            "options": {
                "maxSize": 2000000
            }
        },
        {
            "id": "status_field",
            "name": "status",
            "type": "select",
            "required": true,
            "presentable": false,
            "unique": false,
            "options": {
                "maxSelect": 1,
                "values": [
                    "draft",
                    "questions_generated",
                    "answered",
                    "document_generated",
                    "completed"
                ]
            }
        },
        {
            "id": "ai_prov_field",
            "name": "ai_provider",
            "type": "select",
            "required": false,
            "presentable": false,
            "unique": false,
            "options": {
                "maxSelect": 1,
                "values": [
                    "openrouter",
                    "bbk_proxy",
                    "openrouter_proxy"
                ]
            }
        }
    ]'),
    '@request.auth.id = user_id',
    '@request.auth.id = user_id',
    '@request.auth.id != ""',
    '@request.auth.id = user_id',
    '@request.auth.id = user_id',
    json('{}')
);

-- Create tables for the collections
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL,
    name TEXT NOT NULL,
    template_content TEXT NOT NULL,
    placeholders JSON DEFAULT '[]',
    category TEXT NOT NULL,
    active BOOLEAN DEFAULT 1,
    created TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL,
    updated TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL
);

CREATE TABLE IF NOT EXISTS bedarf (
    id TEXT PRIMARY KEY DEFAULT ('r'||lower(hex(randomblob(7)))) NOT NULL,
    user_id TEXT NOT NULL,
    project_id TEXT,
    initial_description TEXT NOT NULL,
    questions JSON DEFAULT '{}',
    answers JSON DEFAULT '{}',
    document_data JSON DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft',
    ai_provider TEXT DEFAULT 'openrouter',
    created TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL,
    updated TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ')) NOT NULL
);

-- Insert default template
INSERT INTO templates (id, name, template_content, placeholders, category, active)
VALUES (
    'default_template_1',
    'Leistungsbeschreibung Bedarf',
    '<div class="document-template">
    <h1>Leistungsbeschreibung</h1>
    
    <section>
        <h2>1. Projektrahmendaten</h2>
        <div class="content">{{.projektrahmendaten}}</div>
    </section>

    <section>
        <h2>2. Leistungsgegenstand</h2>
        <div class="content">{{.leistungsgegenstand}}</div>
    </section>

    <section>
        <h2>3. Funktionale Anforderungen</h2>
        <div class="content">{{.funktionale_anforderungen}}</div>
    </section>

    <section>
        <h2>4. Technische Spezifikationen</h2>
        <div class="content">{{.technische_spezifikationen}}</div>
    </section>

    <section>
        <h2>5. Qualitätsstandards</h2>
        <div class="content">{{.qualitaetsstandards}}</div>
    </section>

    <section>
        <h2>6. Schnittstellen & Integration</h2>
        <div class="content">{{.schnittstellen_integration}}</div>
    </section>

    <section>
        <h2>7. Sicherheitsanforderungen</h2>
        <div class="content">{{.sicherheitsanforderungen}}</div>
    </section>

    <section>
        <h2>8. Projektablauf & Meilensteine</h2>
        <div class="content">{{.projektablauf_meilensteine}}</div>
    </section>

    <section>
        <h2>9. Dokumentation & Schulung</h2>
        <div class="content">{{.dokumentation_schulung}}</div>
    </section>

    <section>
        <h2>10. Support & Wartung</h2>
        <div class="content">{{.support_wartung}}</div>
    </section>

    <section>
        <h2>11. Abnahmekriterien</h2>
        <div class="content">{{.abnahmekriterien}}</div>
    </section>

    <section>
        <h2>12. Vergütungsmodell</h2>
        <div class="content">{{.verguetungsmodell}}</div>
    </section>
</div>',
    json('["projektrahmendaten","leistungsgegenstand","funktionale_anforderungen","technische_spezifikationen","qualitaetsstandards","schnittstellen_integration","sicherheitsanforderungen","projektablauf_meilensteine","dokumentation_schulung","support_wartung","abnahmekriterien","verguetungsmodell"]'),
    'bedarf',
    1
);

-- Update documents collection to add bedarf_id field
UPDATE _collections 
SET fields = json_patch(fields, '$[#]', json('{
    "id": "bedarf_id_field",
    "name": "bedarf_id",
    "type": "relation",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
        "collectionId": "bedarf_col_id",
        "cascadeDelete": false,
        "minSelect": null,
        "maxSelect": 1,
        "displayFields": null
    }
}'))
WHERE name = 'documents';

-- Add bedarf_id column to documents table
ALTER TABLE documents ADD COLUMN bedarf_id TEXT;