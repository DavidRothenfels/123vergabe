/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const Collection = new Proxy({}, {
        get() {
            return function(data) {
                return app.createCollection(data)
            }
        }
    })

    const Field = new Proxy({}, {
        get() {
            return function(data) {
                return data
            }
        }
    })

    // Create templates collection
    const templatesCollection = app.createCollection({
        "id": "templates_collection",
        "created": new Date().toISOString(),
        "updated": new Date().toISOString(),
        "name": "templates",
        "type": "base",
        "system": false,
        "fields": [
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
                "id": "template_content_field",
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
                "id": "placeholders_field",
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
        ],
        "indexes": [],
        "listRule": "@request.auth.id != ''",
        "viewRule": "@request.auth.id != ''",
        "createRule": "@request.auth.role = 'admin'",
        "updateRule": "@request.auth.role = 'admin'",
        "deleteRule": "@request.auth.role = 'admin'",
        "options": {}
    })

    // Create bedarf collection
    const bedarfCollection = app.createCollection({
        "id": "bedarf_collection",
        "created": new Date().toISOString(),
        "updated": new Date().toISOString(),
        "name": "bedarf",
        "type": "base",
        "system": false,
        "fields": [
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
                "id": "project_id_field",
                "name": "project_id",
                "type": "relation",
                "required": false,
                "presentable": false,
                "unique": false,
                "options": {
                    "collectionId": "projects",
                    "cascadeDelete": false,
                    "minSelect": null,
                    "maxSelect": 1,
                    "displayFields": null
                }
            },
            {
                "id": "initial_description_field",
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
                "id": "document_data_field",
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
                "id": "ai_provider_field",
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
        ],
        "indexes": [],
        "listRule": "@request.auth.id = user_id",
        "viewRule": "@request.auth.id = user_id",
        "createRule": "@request.auth.id != ''",
        "updateRule": "@request.auth.id = user_id",
        "deleteRule": "@request.auth.id = user_id",
        "options": {}
    })

    // Update documents collection to add bedarf_id
    try {
        const documentsCollection = app.findCollectionByNameOrId("documents")
        if (documentsCollection) {
            documentsCollection.fields.push({
                "id": "bedarf_id_field",
                "name": "bedarf_id",
                "type": "relation",
                "required": false,
                "presentable": false,
                "unique": false,
                "options": {
                    "collectionId": bedarfCollection.id,
                    "cascadeDelete": false,
                    "minSelect": null,
                    "maxSelect": 1,
                    "displayFields": null
                }
            })
            app.save(documentsCollection)
        }
    } catch (e) {
        console.log("Documents collection not found or field already exists")
    }

    // Create default template record
    const defaultTemplateData = {
        name: "Leistungsbeschreibung Bedarf",
        category: "bedarf",
        active: true,
        placeholders: JSON.stringify([
            "projektrahmendaten",
            "leistungsgegenstand",
            "funktionale_anforderungen",
            "technische_spezifikationen",
            "qualitaetsstandards",
            "schnittstellen_integration",
            "sicherheitsanforderungen",
            "projektablauf_meilensteine",
            "dokumentation_schulung",
            "support_wartung",
            "abnahmekriterien",
            "verguetungsmodell"
        ]),
        template_content: `
<div class="document-template">
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
</div>
`
    }

    try {
        const templatesCol = app.findCollectionByNameOrId("templates")
        const record = app.newRecord(templatesCol, defaultTemplateData)
        app.save(record)
    } catch (e) {
        console.log("Could not create default template:", e)
    }

}, (app) => {
    // Rollback
    try {
        app.delete(app.findCollectionByNameOrId("templates"))
    } catch (e) {}
    
    try {
        app.delete(app.findCollectionByNameOrId("bedarf"))
    } catch (e) {}
})