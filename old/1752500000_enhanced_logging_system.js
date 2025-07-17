/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  console.log("🔧 Creating enhanced logging system with 24h auto-deletion...")

  // Update or create logs collection with expiration
  let logsCollection
  try {
    logsCollection = app.findCollectionByNameOrId("logs")
    console.log("✅ Found existing logs collection, updating...")
  } catch (e) {
    // Create new logs collection
    logsCollection = new Collection({
      type: "base",
      name: "logs",
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "",  // Allow system to create logs
      updateRule: "",
      deleteRule: "",
      fields: []
    })
  }

  // Clear existing fields and add all needed fields
  logsCollection.fields = []
  
  // Standard ID field
  logsCollection.fields.push(new Field({
    name: "id",
    type: "text",
    required: true,
    system: true,
    primaryKey: true,
    autogeneratePattern: "[a-z0-9]{15}"
  }))

  // Message field for log content
  logsCollection.fields.push(new Field({
    name: "message",
    type: "text",
    required: true,
    max: 5000
  }))

  // Log level (info, warn, error, debug)
  logsCollection.fields.push(new Field({
    name: "level",
    type: "select",
    required: true,
    options: {
      values: ["info", "warn", "error", "debug"]
    }
  }))

  // Source component (cli, pocketbase, opencode, etc.)
  logsCollection.fields.push(new Field({
    name: "source",
    type: "text",
    required: false,
    max: 100
  }))

  // Request ID for tracing
  logsCollection.fields.push(new Field({
    name: "request_id",
    type: "text",
    required: false,
    max: 100
  }))

  // User ID for context
  logsCollection.fields.push(new Field({
    name: "user_id",
    type: "text",
    required: false,
    max: 100
  }))

  // Error details (JSON)
  logsCollection.fields.push(new Field({
    name: "error_details",
    type: "json",
    required: false
  }))

  // Stack trace for errors
  logsCollection.fields.push(new Field({
    name: "stack_trace",
    type: "text",
    required: false,
    max: 10000
  }))

  // Expiration timestamp for 24h auto-deletion
  logsCollection.fields.push(new Field({
    name: "expires_at",
    type: "date",
    required: true
  }))

  // Created timestamp
  logsCollection.fields.push(new Field({
    name: "created",
    type: "autodate",
    onCreate: true,
    onUpdate: false
  }))

  // Updated timestamp
  logsCollection.fields.push(new Field({
    name: "updated",
    type: "autodate",
    onCreate: true,
    onUpdate: true
  }))

  app.save(logsCollection)
  console.log("✅ Enhanced logs collection created/updated")

  // Create error_logs collection for critical errors
  const errorLogsCollection = new Collection({
    type: "base",
    name: "error_logs",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''", 
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      new Field({
        name: "id",
        type: "text",
        required: true,
        system: true,
        primaryKey: true,
        autogeneratePattern: "[a-z0-9]{15}"
      }),
      new Field({
        name: "error_type",
        type: "select",
        required: true,
        options: {
          values: ["cli_error", "pocketbase_error", "opencode_error", "database_error", "network_error", "validation_error"]
        }
      }),
      new Field({
        name: "error_message",
        type: "text",
        required: true,
        max: 5000
      }),
      new Field({
        name: "error_context",
        type: "json",
        required: false
      }),
      new Field({
        name: "stack_trace",
        type: "text",
        required: false,
        max: 10000
      }),
      new Field({
        name: "source_file",
        type: "text",
        required: false,
        max: 500
      }),
      new Field({
        name: "line_number",
        type: "number",
        required: false
      }),
      new Field({
        name: "request_id",
        type: "text",
        required: false,
        max: 100
      }),
      new Field({
        name: "user_id",
        type: "text",
        required: false,
        max: 100
      }),
      new Field({
        name: "severity",
        type: "select",
        required: true,
        options: {
          values: ["low", "medium", "high", "critical"]
        }
      }),
      new Field({
        name: "resolved",
        type: "bool",
        required: false
      }),
      new Field({
        name: "resolution_notes",
        type: "text",
        required: false,
        max: 2000
      }),
      new Field({
        name: "expires_at",
        type: "date",
        required: true
      }),
      new Field({
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false
      }),
      new Field({
        name: "updated", 
        type: "autodate",
        onCreate: true,
        onUpdate: true
      })
    ]
  })

  app.save(errorLogsCollection)
  console.log("✅ Error logs collection created")

  // Create performance_logs collection for monitoring
  const performanceLogsCollection = new Collection({
    type: "base",
    name: "performance_logs",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      new Field({
        name: "id",
        type: "text", 
        required: true,
        system: true,
        primaryKey: true,
        autogeneratePattern: "[a-z0-9]{15}"
      }),
      new Field({
        name: "operation",
        type: "text",
        required: true,
        max: 200
      }),
      new Field({
        name: "duration_ms",
        type: "number",
        required: true
      }),
      new Field({
        name: "source",
        type: "select",
        required: true,
        options: {
          values: ["cli", "pocketbase", "opencode", "database", "api"]
        }
      }),
      new Field({
        name: "metadata",
        type: "json",
        required: false
      }),
      new Field({
        name: "request_id",
        type: "text",
        required: false,
        max: 100
      }),
      new Field({
        name: "user_id",
        type: "text",
        required: false,
        max: 100
      }),
      new Field({
        name: "success",
        type: "bool",
        required: true
      }),
      new Field({
        name: "expires_at",
        type: "date",
        required: true
      }),
      new Field({
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false
      })
    ]
  })

  app.save(performanceLogsCollection)
  console.log("✅ Performance logs collection created")

  console.log("🎉 Enhanced logging system migration completed")

}, (app) => {
  // Rollback function
  console.log("🔙 Rolling back enhanced logging system...")
  
  const collections = ["logs", "error_logs", "performance_logs"]
  collections.forEach(name => {
    try {
      const collection = app.findCollectionByNameOrId(name)
      app.delete(collection)
      console.log(`✅ Deleted collection: ${name}`)
    } catch (e) {
      console.log(`⚠️ Collection ${name} not found during rollback`)
    }
  })
  
  console.log("✅ Rollback completed")
})