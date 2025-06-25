import {
    mysqlTable,
    varchar,
    text,
    timestamp,
    int,
    json,
    index,
} from "drizzle-orm/mysql-core";

export const pokemon = mysqlTable("pokemon", {
    id: int("id").primaryKey(), // Using Pokemon API ID
    name: varchar("name", { length: 100 }).notNull(),
    height: int("height").notNull(), // in decimeters
    weight: int("weight").notNull(), // in hectograms
    baseExperience: int("base_experience"),
    order: int("order"),
    isDefault: int("is_default").default(1), // using int as boolean (1/0)

    // Store sprites as JSON
    sprites: json("sprites"),

    // Store stats as JSON (hp, attack, defense, special-attack, special-defense, speed)
    stats: json("stats"),

    // Store abilities as JSON
    abilities: json("abilities"),

    // Store types as JSON
    types: json("types"),

    // Store moves as JSON (can be large, might want to limit)
    moves: json("moves"),

    // Species URL for additional data
    speciesUrl: text("species_url"),

    // Timestamps
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => ({
    nameIdx: index("name_idx").on(table.name),
    orderIdx: index("order_idx").on(table.order),
}));

export const pokemonType = mysqlTable("pokemon_type", {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 50 }).notNull().unique(),
    url: text("url"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export type Pokemon = typeof pokemon.$inferSelect;
export type NewPokemon = typeof pokemon.$inferInsert;
export type PokemonType = typeof pokemonType.$inferSelect;
export type NewPokemonType = typeof pokemonType.$inferInsert; 