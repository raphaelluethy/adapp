import { db } from "../db";
import { pokemon, pokemonType, type Pokemon, type NewPokemon } from "../db/schema/pokemon";
import { eq, and, or, like, asc, desc } from "drizzle-orm";

// PokeAPI types
interface PokeAPISprites {
    front_default: string | null;
    front_shiny: string | null;
    back_default: string | null;
    back_shiny: string | null;
    front_female?: string | null;
    front_shiny_female?: string | null;
    other?: {
        "official-artwork"?: {
            front_default?: string | null;
        };
        dream_world?: {
            front_default?: string | null;
        };
    };
}

interface PokeAPIStat {
    base_stat: number;
    effort: number;
    stat: {
        name: string;
        url: string;
    };
}

interface PokeAPIType {
    slot: number;
    type: {
        name: string;
        url: string;
    };
}

interface PokeAPIAbility {
    ability: {
        name: string;
        url: string;
    };
    is_hidden: boolean;
    slot: number;
}

interface PokeAPIMove {
    move: {
        name: string;
        url: string;
    };
    version_group_details: Array<{
        level_learned_at: number;
        move_learn_method: {
            name: string;
            url: string;
        };
        version_group: {
            name: string;
            url: string;
        };
    }>;
}

interface PokeAPIPokemon {
    id: number;
    name: string;
    height: number;
    weight: number;
    base_experience: number | null;
    order: number;
    is_default: boolean;
    sprites: PokeAPISprites;
    stats: PokeAPIStat[];
    types: PokeAPIType[];
    abilities: PokeAPIAbility[];
    moves: PokeAPIMove[];
    species: {
        name: string;
        url: string;
    };
}

class PokeAPIService {
    private baseUrl = "https://pokeapi.co/api/v2";
    private cache = new Map<string, any>();
    private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour

    private async fetchWithCache<T>(url: string): Promise<T> {
        const cacheKey = url;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now(),
            });

            return data;
        } catch (error) {
            console.error(`Failed to fetch from ${url}:`, error);
            throw error;
        }
    }

    async fetchPokemon(idOrName: string | number): Promise<PokeAPIPokemon> {
        const url = `${this.baseUrl}/pokemon/${idOrName}`;
        return this.fetchWithCache<PokeAPIPokemon>(url);
    }

    async fetchPokemonList(limit = 20, offset = 0): Promise<{
        count: number;
        next: string | null;
        previous: string | null;
        results: Array<{ name: string; url: string }>;
    }> {
        const url = `${this.baseUrl}/pokemon?limit=${limit}&offset=${offset}`;
        return this.fetchWithCache(url);
    }

    async fetchType(nameOrId: string | number) {
        const url = `${this.baseUrl}/type/${nameOrId}`;
        return this.fetchWithCache(url);
    }
}

export const pokeApiService = new PokeAPIService();

// Database operations
export class PokemonService {
    async getPokemonById(id: number): Promise<Pokemon | null> {
        const result = await db.select().from(pokemon).where(eq(pokemon.id, id));
        return result[0] || null;
    }

    async getPokemonByName(name: string): Promise<Pokemon | null> {
        const result = await db.select().from(pokemon).where(eq(pokemon.name, name));
        return result[0] || null;
    }

    async getAllPokemon(
        limit = 20,
        offset = 0,
        search?: string,
        typeFilter?: string
    ): Promise<Pokemon[]> {
        let whereCondition = undefined;

        // Add search filter
        if (search) {
            whereCondition = like(pokemon.name, `%${search}%`);
        }

        // Add type filter (search in JSON field)
        // Note: This is a simplified approach. For better performance, consider denormalizing types

        const query = db.select().from(pokemon);

        if (whereCondition) {
            return query
                .where(whereCondition)
                .orderBy(asc(pokemon.order))
                .limit(limit)
                .offset(offset);
        }

        return query
            .orderBy(asc(pokemon.order))
            .limit(limit)
            .offset(offset);
    }

    async getRandomPokemon(count = 1): Promise<Pokemon[]> {
        // Get random Pokemon IDs (1-1010 for current gen)
        const randomIds = Array.from({ length: count }, () =>
            Math.floor(Math.random() * 1010) + 1
        );

        const results = await db.select()
            .from(pokemon)
            .where(or(...randomIds.map(id => eq(pokemon.id, id))));

        return results;
    }

    async fetchAndCachePokemon(idOrName: string | number): Promise<Pokemon> {
        // Check if Pokemon exists in database
        const existingPokemon = typeof idOrName === 'number'
            ? await this.getPokemonById(idOrName)
            : await this.getPokemonByName(idOrName);

        if (existingPokemon) {
            return existingPokemon;
        }

        // Fetch from PokeAPI
        const pokeApiData = await pokeApiService.fetchPokemon(idOrName);

        // Transform and save to database
        const pokemonData: NewPokemon = {
            id: pokeApiData.id,
            name: pokeApiData.name,
            height: pokeApiData.height,
            weight: pokeApiData.weight,
            baseExperience: pokeApiData.base_experience,
            order: pokeApiData.order,
            isDefault: pokeApiData.is_default ? 1 : 0,
            sprites: pokeApiData.sprites,
            stats: pokeApiData.stats,
            abilities: pokeApiData.abilities,
            types: pokeApiData.types,
            moves: pokeApiData.moves.slice(0, 20), // Limit moves to avoid huge JSON
            speciesUrl: pokeApiData.species.url,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.insert(pokemon).values(pokemonData);

        return pokemonData as Pokemon;
    }

    async fetchAndCacheMultiplePokemon(ids: number[]): Promise<Pokemon[]> {
        const results: Pokemon[] = [];

        for (const id of ids) {
            try {
                const pokemonData = await this.fetchAndCachePokemon(id);
                results.push(pokemonData);
            } catch (error) {
                console.error(`Failed to fetch Pokemon ${id}:`, error);
            }
        }

        return results;
    }

    async initializeWithBasicPokemon(): Promise<void> {
        // Check if we have any Pokemon in the database
        const count = await db.select().from(pokemon).limit(1);

        if (count.length === 0) {
            console.log("Initializing database with first 151 Pokemon...");

            // Fetch first 151 Pokemon in batches
            const batchSize = 10;
            for (let i = 1; i <= 151; i += batchSize) {
                const batch = Array.from({ length: Math.min(batchSize, 151 - i + 1) }, (_, idx) => i + idx);
                await this.fetchAndCacheMultiplePokemon(batch);
                console.log(`Cached Pokemon ${i} to ${Math.min(i + batchSize - 1, 151)}`);
            }

            console.log("Initial Pokemon data cached successfully!");
        }
    }

    // Helper method to get formatted Pokemon for frontend
    async getFormattedPokemon(pokemonData: Pokemon): Promise<{
        id: number;
        name: string;
        image: string;
        types: string[];
        stats: {
            hp: number;
            attack: number;
            defense: number;
            "special-attack": number;
            "special-defense": number;
            speed: number;
        };
        height: number; // converted to cm
        weight: number; // converted to kg
    }> {
        const stats = pokemonData.stats as PokeAPIStat[];
        const types = pokemonData.types as PokeAPIType[];
        const sprites = pokemonData.sprites as PokeAPISprites;

        return {
            id: pokemonData.id,
            name: pokemonData.name,
            image: sprites.other?.["official-artwork"]?.front_default ||
                sprites.front_default ||
                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonData.id}.png`,
            types: types.map(t => t.type.name),
            stats: {
                hp: stats.find(s => s.stat.name === 'hp')?.base_stat || 0,
                attack: stats.find(s => s.stat.name === 'attack')?.base_stat || 0,
                defense: stats.find(s => s.stat.name === 'defense')?.base_stat || 0,
                "special-attack": stats.find(s => s.stat.name === 'special-attack')?.base_stat || 0,
                "special-defense": stats.find(s => s.stat.name === 'special-defense')?.base_stat || 0,
                speed: stats.find(s => s.stat.name === 'speed')?.base_stat || 0,
            },
            height: pokemonData.height * 10, // decimeters to cm
            weight: Math.round(pokemonData.weight / 10), // hectograms to kg
        };
    }
}

export const pokemonService = new PokemonService();
