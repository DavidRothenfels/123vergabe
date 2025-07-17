-- Fix bedarf collection with correct project collection ID
INSERT OR REPLACE INTO _collections (id, system, type, name, fields, listRule, viewRule, createRule, updateRule, deleteRule, options)
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
                "collectionId": "pbc_484305853",
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