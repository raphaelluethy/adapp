import {
  protectedProcedure, publicProcedure,
  router,
} from "../lib/trpc";
import { z } from "zod";
import { pokemonService } from "../lib/pokemon";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),

  // Pokemon routes
  pokemon: router({
    // Get all Pokemon with pagination and filtering
    list: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
        type: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const pokemon = await pokemonService.getAllPokemon(
          input.limit,
          input.offset,
          input.search,
          input.type
        );

        // Format Pokemon data for frontend
        const formattedPokemon = await Promise.all(
          pokemon.map(p => pokemonService.getFormattedPokemon(p))
        );

        return {
          pokemon: formattedPokemon,
          hasMore: pokemon.length === input.limit,
        };
      }),

    // Get Pokemon by ID
    getById: publicProcedure
      .input(z.object({
        id: z.number().min(1),
      }))
      .query(async ({ input }) => {
        const pokemon = await pokemonService.fetchAndCachePokemon(input.id);
        return pokemonService.getFormattedPokemon(pokemon);
      }),

    // Get Pokemon by name
    getByName: publicProcedure
      .input(z.object({
        name: z.string().min(1),
      }))
      .query(async ({ input }) => {
        const pokemon = await pokemonService.fetchAndCachePokemon(input.name);
        return pokemonService.getFormattedPokemon(pokemon);
      }),

    // Get random Pokemon
    random: publicProcedure
      .input(z.object({
        count: z.number().min(1).max(20).default(6),
      }))
      .query(async ({ input }) => {
        const pokemon = await pokemonService.getRandomPokemon(input.count);
        const formattedPokemon = await Promise.all(
          pokemon.map(p => pokemonService.getFormattedPokemon(p))
        );
        return formattedPokemon;
      }),

    // Initialize database with basic Pokemon (admin function)
    initialize: protectedProcedure
      .mutation(async () => {
        await pokemonService.initializeWithBasicPokemon();
        return { success: true, message: "Pokemon database initialized" };
      }),
  }),
});

export type AppRouter = typeof appRouter;
