/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    // Find users collection
    const usersCollection = app.findCollectionByNameOrId("users")

    // Create templates collection
    const templatesCollection = new Collection({
        type: "base",
        name: "templates",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''", 
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
            {
                name: "name",
                type: "text",
                required: true,
                max: 255
            },
            {
                name: "template_content",
                type: "editor",
                required: true
            },
            {
                name: "placeholders",
                type: "json",
                required: false
            },
            {
                name: "category",
                type: "select",
                required: true,
                options: {
                    maxSelect: 1,
                    values: ["leistung", "eignung", "zuschlag", "bedarf"]
                }
            },
            {
                name: "active",
                type: "bool",
                required: false
            }
        ]
    })
    app.save(templatesCollection)

    // Create bedarf collection for needs analysis
    const bedarfCollection = new Collection({
        type: "base", 
        name: "bedarf",
        listRule: "@request.auth.id = user_id",
        viewRule: "@request.auth.id = user_id",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id = user_id",
        deleteRule: "@request.auth.id = user_id",
        fields: [
            {
                name: "user_id",
                type: "relation",
                required: true,
                maxSelect: 1,
                collectionId: usersCollection.id,
                cascadeDelete: true
            },
            {
                name: "project_id",
                type: "relation",
                required: false,
                maxSelect: 1,
                collectionId: "projects"
            },
            {
                name: "initial_description",
                type: "text",
                required: true,
                max: 5000
            },
            {
                name: "questions",
                type: "json",
                required: false
            },
            {
                name: "answers",
                type: "json", 
                required: false
            },
            {
                name: "document_data",
                type: "json",
                required: false
            },
            {
                name: "status",
                type: "select",
                required: true,
                options: {
                    maxSelect: 1,
                    values: ["draft", "questions_generated", "answered", "document_generated", "completed"]
                }
            },
            {
                name: "ai_provider",
                type: "select",
                required: false,
                options: {
                    maxSelect: 1,
                    values: ["openrouter", "bbk_proxy", "openrouter_proxy"]
                }
            }
        ]
    })
    app.save(bedarfCollection)

    // Update documents collection to link to bedarf
    try {
        const documentsCollection = app.findCollectionByNameOrId("documents")
        const bedarfField = {
            name: "bedarf_id",
            type: "relation",
            required: false,
            maxSelect: 1,
            collectionId: bedarfCollection.id
        }
        documentsCollection.fields.push(bedarfField)
        app.save(documentsCollection)
    } catch (e) {
        console.log("Documents collection not found or field already exists")
    }

    // Create default template for Leistungsbeschreibung Bedarf
    const defaultTemplate = new Record(templatesCollection, {
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
    })
    app.save(defaultTemplate)

}, (app) => {
    // Rollback
    const collections = ["templates", "bedarf"]
    collections.forEach(name => {
        try {
            const collection = app.findCollectionByNameOrId(name)
            app.delete(collection)
        } catch (e) {
            // Collection doesn't exist
        }
    })
})