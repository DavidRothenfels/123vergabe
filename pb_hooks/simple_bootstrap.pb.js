/// <reference path="../pb_data/types.d.ts" />

/**
 * Simple Bootstrap Hook - Only fix collection rules
 * PocketBase v0.28 compatible
 */

onBootstrap((e) => {
    e.next() // KRITISCH für v0.28
    
    console.log("🔧 Bootstrap: System initialization...")
    console.log("📌 Admin creation: ./pocketbase superuser upsert admin@vergabe.de admin123")
    console.log("📌 Demo user creation: Use Admin Panel to create test@vergabe.de / vergabe123")
    console.log("🎯 System ready for manual user setup")
})