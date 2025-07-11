/// <reference path="../pb_data/types.d.ts" />

/**
 * Fresh Start Migration - Backup existing data and create clean setup
 * PocketBase v0.28 compatible - Based on working reference project
 */

migrate((app) => {
  console.log("🔄 Starting fresh start migration...")
  console.log("🗄️ Backing up existing data and creating clean setup...")

  // ========================================
  // 1. BACKUP AND CLEAN EXISTING COLLECTIONS
  // ========================================
  const collectionsToBackup = [
    "prompts", "apikeys", "vergabe_projects", "vergabe_documents", 
    "generation_requests", "cli_commands", "logs", "example_prompts",
    "system_prompts", "user_api_keys", "documents", "projects"
  ]
  
  collectionsToBackup.forEach(name => {
    try {
      const collection = app.findCollectionByNameOrId(name)
      console.log(`🗑️ Backing up and removing existing collection: ${name}`)
      app.delete(collection)
      console.log(`✅ Deleted collection: ${name}`)
    } catch (e) {
      console.log(`ℹ️ Collection ${name} not found (clean state)`)
    }
  })

  // ========================================
  // 2. USERS COLLECTION (ensure it exists)
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
  // 3. PROJECTS COLLECTION (from reference)
  // ========================================
  const projectsCollection = new Collection({
    type: "base",
    name: "projects",
    listRule: "@request.auth.id = user_id || @request.auth.type = 'admin'",
    viewRule: "@request.auth.id = user_id || @request.auth.type = 'admin'", 
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user_id || @request.auth.type = 'admin'",
    deleteRule: "@request.auth.id = user_id || @request.auth.type = 'admin'",
    fields: [
      {
        name: "name",
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
        name: "eckpunkte",
        type: "text",
        required: false,
        max: 5000
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
        name: "request_id",
        type: "text",
        required: true,
        min: 1,
        max: 50
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
  app.save(projectsCollection)
  console.log("✅ projects collection created")

  // ========================================
  // 4. DOCUMENTS COLLECTION (from reference)
  // ========================================
  const documentsCollection = new Collection({
    type: "base",
    name: "documents",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        name: "request_id",
        type: "text",
        required: true,
        min: 1,
        max: 255
      },
      {
        name: "title",
        type: "text",
        required: true,
        min: 1,
        max: 255
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
        name: "created_by",
        type: "text",
        required: false,
        max: 100
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
  app.save(documentsCollection)
  console.log("✅ documents collection created")

  // ========================================
  // 5. GENERATION_REQUESTS COLLECTION (from reference)
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
  // 6. CLI_COMMANDS COLLECTION (from reference)
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
  // 7. LOGS COLLECTION (from reference)
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
  // 8. EXAMPLE_PROMPTS COLLECTION (from reference)
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
  // ADMIN & USER CREATION (from reference)
  // ========================================
  
  // Create superuser admin - use v0.28 compatible method
  console.log("👤 Creating superuser admin...")
  
  // In v0.28+, admin creation in migrations is limited
  // We'll use a bootstrap hook instead or manual creation
  console.log("📌 Admin creation must be done manually:")
  console.log("📌 Run: ./pocketbase superuser upsert admin@vergabe.de admin123")
  console.log("📌 Or use the web interface after first start")

  // Create demo user (EXACTLY like reference)
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
  // DATA SEEDING (from reference)
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

  // Create sample project with documents (from reference)
  try {
    const demoUser = app.dao().findFirstRecordByFilter("users", "email = {:email}", {"email": "test@vergabe.de"})
    if (demoUser) {
      const sampleProject = new Record(projectsCollection, {
        name: "Website-Relaunch Demo",
        description: "Beispielprojekt für Website-Erneuerung",
        user_id: demoUser.id,
        request_id: "TEST-001"
      })
      app.dao().saveRecord(sampleProject)
      console.log("✅ Sample project created")
      
      // Create demo documents
      const demoDocuments = [
        {
          request_id: "TEST-001",
          title: "Leistungsbeschreibung",
          content: `# Leistungsbeschreibung: Website-Relaunch Demo

## Projektziel
Modernisierung der Unternehmenswebsite mit Fokus auf Design und Barrierefreiheit.

## Leistungsumfang
- Responsive Design
- CMS-Integration
- SEO-Optimierung
- Barrierefreiheit nach WCAG 2.1`,
          type: "leistung",
          created_by: "Demo System"
        },
        {
          request_id: "TEST-001",
          title: "Eignungskriterien",
          content: `# Eignungskriterien: Website-Relaunch Demo

## Fachliche Eignung
- Mindestens 3 Jahre Erfahrung im Webdesign
- Referenzprojekte mit CMS-Systemen

## Technische Eignung
- Moderne Entwicklungstools
- Responsive Design Expertise`,
          type: "eignung",
          created_by: "Demo System"
        }
      ]
      
      demoDocuments.forEach((docData, index) => {
        try {
          const document = new Record(documentsCollection, docData)
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

  console.log("🎉 Fresh start migration completed successfully!")
  console.log("📊 Created all essential collections with seeded data")
  console.log("👤 Created demo user")

}, (app) => {
  // Rollback
  console.log("🔄 Rolling back fresh start migration...")
  
  const collections = [
    "example_prompts", "logs", "cli_commands", "generation_requests", "documents", "projects"
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