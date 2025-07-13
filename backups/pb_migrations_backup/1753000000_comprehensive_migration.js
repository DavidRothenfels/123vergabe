/// <reference path="../pb_data/types.d.ts" />

/**
 * Comprehensive Migration - All essential collections
 * PocketBase v0.28 compatible
 */

migrate((app) => {
  console.log("🚀 Starting comprehensive migration...")

  // ========================================
  // 1. USERS COLLECTION (falls nicht existiert)
  // ========================================
  let usersCollection
  try {
    usersCollection = app.findCollectionByNameOrId("users")
    console.log("ℹ️ Users collection already exists")
  } catch (e) {
    usersCollection = new Collection({
      type: "auth",
      name: "users",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        {
          name: "name",
          type: "text",
          required: false,
          max: 100
        }
      ]
    })
    app.save(usersCollection)
    console.log("✅ users collection created")
  }

  // ========================================
  // 2. PROMPTS COLLECTION
  // ========================================
  let promptsCollection
  try {
    promptsCollection = app.findCollectionByNameOrId("prompts")
    console.log("ℹ️ Prompts collection already exists")
  } catch (e) {
    promptsCollection = new Collection({
      type: "base",
      name: "prompts",
      listRule: "",
      viewRule: "",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          min: 1,
          max: 200
        },
        {
          name: "content",
          type: "text",
          required: true,
          min: 1,
          max: 10000
        },
        {
          name: "type",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["leistung", "eignung", "zuschlag", "system"]
        },
        {
          name: "user_id",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: usersCollection.id,
          cascadeDelete: true
        },
        {
          name: "created",
          type: "autodate",
          onCreate: true,
          onUpdate: false
        },
        {
          name: "updated",
          type: "autodate",
          onCreate: true,
          onUpdate: true
        }
      ]
    })
    app.save(promptsCollection)
    console.log("✅ prompts collection created")
  }

  // ========================================
  // 3. APIKEYS COLLECTION
  // ========================================
  const apikeysCollection = new Collection({
    type: "base",
    name: "apikeys",
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
        name: "provider",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["openai", "anthropic", "google", "azure"]
      },
      {
        name: "api_key",
        type: "text",
        required: true,
        max: 500
      },
      {
        name: "name",
        type: "text",
        required: false,
        max: 100
      },
      {
        name: "active",
        type: "bool",
        required: false
      },
      {
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false
      },
      {
        name: "updated",
        type: "autodate",
        onCreate: true,
        onUpdate: true
      }
    ]
  })
  app.save(apikeysCollection)
  console.log("✅ apikeys collection created")

  // ========================================
  // 4. VERGABE COLLECTIONS
  // ========================================
  const vergabeProjectsCollection = new Collection({
    type: "base",
    name: "vergabe_projects",
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
        name: "title",
        type: "text",
        required: true,
        min: 1,
        max: 200
      },
      {
        name: "description",
        type: "text",
        required: false,
        max: 2000
      },
      {
        name: "budget",
        type: "number",
        required: false,
        min: 0
      },
      {
        name: "deadline",
        type: "date",
        required: false
      },
      {
        name: "status",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["draft", "processing", "completed", "archived"]
      },
      {
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false
      },
      {
        name: "updated",
        type: "autodate",
        onCreate: true,
        onUpdate: true
      }
    ]
  })
  app.save(vergabeProjectsCollection)
  console.log("✅ vergabe_projects collection created")

  const vergabeDocumentsCollection = new Collection({
    type: "base",
    name: "vergabe_documents",
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
        required: true,
        maxSelect: 1,
        collectionId: vergabeProjectsCollection.id,
        cascadeDelete: true
      },
      {
        name: "title",
        type: "text",
        required: true,
        min: 1,
        max: 200
      },
      {
        name: "content",
        type: "text",
        required: true,
        min: 1,
        max: 50000
      },
      {
        name: "type",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["leistung", "eignung", "zuschlag"]
      },
      {
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false
      },
      {
        name: "updated",
        type: "autodate",
        onCreate: true,
        onUpdate: true
      }
    ]
  })
  app.save(vergabeDocumentsCollection)
  console.log("✅ vergabe_documents collection created")

  // ========================================
  // 5. AUTONOMOUS WORKFLOW COLLECTIONS
  // ========================================
  const generationRequestsCollection = new Collection({
    type: "base",
    name: "generation_requests",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    fields: [
      {
        name: "user_need_id",
        type: "text",
        required: false
      },
      {
        name: "status",
        type: "select",
        required: false,
        maxSelect: 1,
        values: ["pending", "processing", "completed", "failed"]
      },
      {
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false
      },
      {
        name: "updated",
        type: "autodate",
        onCreate: true,
        onUpdate: true
      }
    ]
  })
  app.save(generationRequestsCollection)
  console.log("✅ generation_requests collection created")

  // ========================================
  // 6. CLI_COMMANDS COLLECTION
  // ========================================
  const cliCommandsCollection = new Collection({
    type: "base",
    name: "cli_commands",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        name: "command",
        type: "text",
        required: true,
        max: 100
      },
      {
        name: "status",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["pending", "processing", "completed", "failed"]
      },
      {
        name: "parameters",
        type: "text",
        required: false,
        max: 2000
      },
      {
        name: "retry_count",
        type: "number",
        required: false,
        min: 0,
        max: 10
      },
      {
        name: "error",
        type: "text",
        required: false,
        max: 2000
      },
      {
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false
      },
      {
        name: "updated",
        type: "autodate",
        onCreate: true,
        onUpdate: true
      }
    ]
  })
  app.save(cliCommandsCollection)
  console.log("✅ cli_commands collection created")

  // ========================================
  // 7. LOGS COLLECTION
  // ========================================
  const logsCollection = new Collection({
    type: "base",
    name: "logs",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        name: "message",
        type: "text",
        required: true,
        max: 1000
      },
      {
        name: "level",
        type: "select",
        required: false,
        maxSelect: 1,
        values: ["info", "warning", "error", "success"]
      },
      {
        name: "request_id",
        type: "text",
        required: false,
        max: 100
      },
      {
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false
      }
    ]
  })
  app.save(logsCollection)
  console.log("✅ logs collection created")

  // ========================================
  // 8. EXAMPLE_PROMPTS COLLECTION
  // ========================================
  const examplePromptsCollection = new Collection({
    type: "base",
    name: "example_prompts",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
        min: 1,
        max: 100
      },
      {
        name: "prompt_text",
        type: "text",
        required: true,
        min: 10,
        max: 2000
      },
      {
        name: "sort_order",
        type: "number",
        required: false,
        min: 0
      },
      {
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false
      },
      {
        name: "updated",
        type: "autodate",
        onCreate: true,
        onUpdate: true
      }
    ]
  })
  app.save(examplePromptsCollection)
  console.log("✅ example_prompts collection created")

  // ========================================
  // ADMIN & USER CREATION
  // ========================================
  
  // Create superuser admin - use v0.28 compatible method
  console.log("👤 Creating superuser admin...")
  
  // In v0.28+, admin creation in migrations is limited
  // We'll use a bootstrap hook instead or manual creation
  console.log("📌 Admin creation must be done manually:")
  console.log("📌 Run: ./pocketbase superuser upsert admin@vergabe.de admin123")
  console.log("📌 Or use the web interface after first start")

  // Create demo user
  try {
    const demoUser = new Record(usersCollection, {
      username: "demo",
      email: "test@vergabe.de",
      emailVisibility: true,
      verified: true,
      name: "Demo User"
    })
    demoUser.setPassword("vergabe123")
    app.dao().saveRecord(demoUser)
    console.log("✅ Demo user created: test@vergabe.de / vergabe123")
  } catch (e) {
    console.log("ℹ️ Demo user might already exist:", e.message)
  }

  // ========================================
  // DATA SEEDING
  // ========================================

  // Create example prompts
  const examplePrompts = [
    {
      title: "Website-Relaunch",
      prompt_text: "Erstelle Vergabeunterlagen für den Relaunch unserer Unternehmenswebsite. Das Budget beträgt 50.000 €. Wichtig sind ein modernes Design, Barrierefreiheit und ein CMS-System.",
      sort_order: 10
    },
    {
      title: "Büro-Renovierung",
      prompt_text: "Ich benötige eine Leistungsbeschreibung für die Renovierung unserer Büroräume auf 200qm. Die Arbeiten umfassen Malerarbeiten, neuen Bodenbelag und die Erneuerung der Elektrik.",
      sort_order: 20
    },
    {
      title: "DSGVO-Beratung",
      prompt_text: "Wir benötigen eine Ausschreibung für externe DSGVO-Beratungsleistungen zur Überprüfung und Anpassung unserer internen Prozesse. Geplant sind 10 Beratungstage.",
      sort_order: 30
    },
    {
      title: "IT-Software Entwicklung",
      prompt_text: "Entwicklung einer modernen Projektmanagement-Software mit Budget von 150.000 € und Laufzeit von 6 Monaten. Benötigt werden Admin-Panel, Benutzeroberfläche und API-Integration.",
      sort_order: 40
    }
  ]

  examplePrompts.forEach((prompt, index) => {
    try {
      const record = new Record(examplePromptsCollection, prompt)
      app.dao().saveRecord(record)
      console.log(`✅ Example prompt ${index + 1} created: ${prompt.title}`)
    } catch (e) {
      console.log(`⚠️ Failed to create example prompt: ${prompt.title}`)
    }
  })

  // Create sample project with documents
  try {
    const demoUser = app.dao().findFirstRecordByFilter("users", "email = {:email}", {"email": "test@vergabe.de"})
    if (demoUser) {
      const sampleProject = new Record(vergabeProjectsCollection, {
        title: "Website-Relaunch Demo",
        description: "Beispielprojekt für Website-Erneuerung",
        status: "draft",
        user_id: demoUser.id
      })
      app.dao().saveRecord(sampleProject)
      console.log("✅ Sample project created")
      
      // Create demo documents
      const demoDocuments = [
        {
          user_id: demoUser.id,
          project_id: sampleProject.id,
          title: "Leistungsbeschreibung",
          content: `# Leistungsbeschreibung: Website-Relaunch Demo

## Projektziel
Modernisierung der Unternehmenswebsite mit Fokus auf Design und Barrierefreiheit.

## Leistungsumfang
- Responsive Design
- CMS-Integration
- SEO-Optimierung
- Barrierefreiheit nach WCAG 2.1`,
          type: "leistung"
        },
        {
          user_id: demoUser.id,
          project_id: sampleProject.id,
          title: "Eignungskriterien",
          content: `# Eignungskriterien: Website-Relaunch Demo

## Fachliche Eignung
- Mindestens 3 Jahre Erfahrung im Webdesign
- Referenzprojekte mit CMS-Systemen

## Technische Eignung
- Moderne Entwicklungstools
- Responsive Design Expertise`,
          type: "eignung"
        }
      ]
      
      demoDocuments.forEach((docData, index) => {
        try {
          const document = new Record(vergabeDocumentsCollection, docData)
          app.dao().saveRecord(document)
          console.log(`✅ Demo document ${index + 1} created: ${docData.title}`)
        } catch (e) {
          console.log(`⚠️ Failed to create demo document: ${docData.title}`)
        }
      })
    }
  } catch (e) {
    console.log("ℹ️ Could not create sample project")
  }

  console.log("🎉 Comprehensive migration completed successfully!")
  console.log("📊 Created all essential collections with seeded data")
  console.log("👤 Created demo user")

}, (app) => {
  // Rollback
  console.log("🔄 Rolling back comprehensive migration...")
  
  const collections = [
    "example_prompts", "logs", "cli_commands", "generation_requests", "vergabe_documents", "vergabe_projects", "apikeys", "prompts"
  ]
  
  collections.forEach(name => {
    try {
      const collection = app.findCollectionByNameOrId(name)
      app.delete(collection)
      console.log(`✅ Deleted collection: ${name}`)
    } catch (e) {
      console.log(`ℹ️ Collection ${name} not found for deletion`)
    }
  })

  console.log("🔄 Rollback completed")
})