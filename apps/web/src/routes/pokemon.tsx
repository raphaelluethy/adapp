import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

// Mock Pokemon data structure
interface Pokemon {
    id: number;
    name: string;
    image: string;
    types: string[];
    stats: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
    };
    height: number;
    weight: number;
}

// Generate mock Pokemon data (150 entries for testing performance)
const generateMockPokemon = (): Pokemon[] => {
    const types = [
        "Fire",
        "Water",
        "Grass",
        "Electric",
        "Psychic",
        "Ice",
        "Dragon",
        "Dark",
        "Fighting",
        "Poison",
        "Ground",
        "Flying",
        "Bug",
        "Rock",
        "Ghost",
        "Steel",
        "Fairy",
        "Normal",
    ];

    const pokemonNames = [
        "Pikachu",
        "Charizard",
        "Blastoise",
        "Venusaur",
        "Alakazam",
        "Machamp",
        "Gengar",
        "Lapras",
        "Snorlax",
        "Mewtwo",
        "Dragonite",
        "Gyarados",
        "Articuno",
        "Zapdos",
        "Moltres",
        "Mew",
        "Typhlosion",
        "Feraligatr",
        "Meganium",
        "Lugia",
        "Ho-Oh",
        "Celebi",
        "Blaziken",
        "Swampert",
        "Sceptile",
        "Rayquaza",
        "Kyogre",
        "Groudon",
        "Dialga",
        "Palkia",
    ];

    return Array.from({ length: 150 }, (_, index) => {
        const baseId = index + 1;
        const nameIndex = index % pokemonNames.length;
        const suffix =
            Math.floor(index / pokemonNames.length) > 0
                ? ` ${Math.floor(index / pokemonNames.length) + 1}`
                : "";

        return {
            id: baseId,
            name: `${pokemonNames[nameIndex]}${suffix}`,
            image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${(index % 151) + 1}.png`,
            types: [
                types[Math.floor(Math.random() * types.length)],
                ...(Math.random() > 0.5
                    ? [types[Math.floor(Math.random() * types.length)]]
                    : []),
            ].slice(0, 2),
            stats: {
                hp: Math.floor(Math.random() * 100) + 50,
                attack: Math.floor(Math.random() * 100) + 40,
                defense: Math.floor(Math.random() * 100) + 35,
                speed: Math.floor(Math.random() * 100) + 30,
            },
            height: Math.floor(Math.random() * 200) + 30, // cm
            weight: Math.floor(Math.random() * 500) + 50, // kg
        };
    });
};

// Pokemon type color mapping for visual appeal
const typeColors: Record<string, string> = {
    Fire: "bg-red-500",
    Water: "bg-blue-500",
    Grass: "bg-green-500",
    Electric: "bg-yellow-500",
    Psychic: "bg-pink-500",
    Ice: "bg-cyan-400",
    Dragon: "bg-purple-600",
    Dark: "bg-gray-800",
    Fighting: "bg-red-700",
    Poison: "bg-purple-500",
    Ground: "bg-yellow-600",
    Flying: "bg-indigo-400",
    Bug: "bg-green-400",
    Rock: "bg-yellow-700",
    Ghost: "bg-purple-700",
    Steel: "bg-gray-500",
    Fairy: "bg-pink-300",
    Normal: "bg-gray-400",
};

// Pokemon Card Component
interface PokemonCardProps {
    pokemon: Pokemon;
}

function PokemonCard({ pokemon }: PokemonCardProps) {
    return (
        <Card className="group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">
                        {pokemon.name}
                    </CardTitle>
                    <span className="text-muted-foreground text-sm">
                        #{pokemon.id.toString().padStart(3, "0")}
                    </span>
                </div>
                <div className="flex gap-1">
                    {pokemon.types.map((type) => (
                        <span
                            key={type}
                            className={cn(
                                "rounded-full px-2 py-1 font-medium text-white text-xs",
                                typeColors[type] || "bg-gray-400",
                            )}
                        >
                            {type}
                        </span>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-center">
                    <img
                        src={pokemon.image}
                        alt={pokemon.name}
                        className="h-24 w-24 object-contain transition-transform duration-200 group-hover:scale-110"
                        loading="lazy"
                    />
                </div>

                <div className="space-y-2">
                    <div className="text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Height:
                            </span>
                            <span>{pokemon.height} cm</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Weight:
                            </span>
                            <span>{pokemon.weight} kg</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="font-medium text-sm">Stats</div>
                        {Object.entries(pokemon.stats).map(([stat, value]) => (
                            <div key={stat} className="flex items-center gap-2">
                                <span className="w-12 text-muted-foreground text-xs capitalize">
                                    {stat}:
                                </span>
                                <div className="h-1.5 flex-1 rounded-full bg-muted">
                                    <div
                                        className="h-1.5 rounded-full bg-primary transition-all duration-300"
                                        style={{
                                            width: `${Math.min((value / 150) * 100, 100)}%`,
                                        }}
                                    />
                                </div>
                                <span className="w-8 text-right text-xs">
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Virtual scrolling hook for performance optimization
function useVirtualScrolling(items: Pokemon[], itemsPerPage = 20) {
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const visibleItems = useMemo(() => {
        const startIndex = 0;
        const endIndex = currentPage * itemsPerPage;
        return items.slice(startIndex, endIndex);
    }, [items, currentPage, itemsPerPage]);

    const hasMore = currentPage * itemsPerPage < items.length;

    const loadMore = () => {
        if (!hasMore || isLoading) return;

        setIsLoading(true);
        // Simulate loading delay for better UX
        setTimeout(() => {
            setCurrentPage((prev) => prev + 1);
            setIsLoading(false);
        }, 300);
    };

    return {
        visibleItems,
        hasMore,
        isLoading,
        loadMore,
        totalCount: items.length,
        currentCount: visibleItems.length,
    };
}

export const Route = createFileRoute("/pokemon")({
    component: RouteComponent,
});

function RouteComponent() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");

    const allPokemon = useMemo(() => generateMockPokemon(), []);

    // Filter Pokemon based on search and type
    const filteredPokemon = useMemo(() => {
        return allPokemon.filter((pokemon) => {
            const matchesSearch = pokemon.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            const matchesType =
                selectedType === "all" || pokemon.types.includes(selectedType);
            return matchesSearch && matchesType;
        });
    }, [allPokemon, searchTerm, selectedType]);

    const {
        visibleItems,
        hasMore,
        isLoading,
        loadMore,
        totalCount,
        currentCount,
    } = useVirtualScrolling(filteredPokemon);

    const uniqueTypes = useMemo(() => {
        const types = new Set<string>();
        allPokemon.forEach((pokemon) => {
            pokemon.types.forEach((type) => types.add(type));
        });
        return Array.from(types).sort();
    }, [allPokemon]);

    return (
        <div className="container mx-auto space-y-6 px-4 py-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="font-bold text-3xl">Pokemon Feed</h1>
                <p className="text-muted-foreground">
                    Discover and explore {totalCount} amazing Pokemon creatures
                </p>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search Pokemon..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <div className="sm:w-48">
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="all">All Types</option>
                        {uniqueTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Results count */}
            <div className="text-muted-foreground text-sm">
                Showing {currentCount} of {filteredPokemon.length} Pokemon
                {searchTerm && ` matching "${searchTerm}"`}
                {selectedType !== "all" && ` of type "${selectedType}"`}
            </div>

            {/* Pokemon Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visibleItems.map((pokemon) => (
                    <PokemonCard key={pokemon.id} pokemon={pokemon} />
                ))}
            </div>

            {/* Load More / Loading State */}
            {hasMore && (
                <div className="flex justify-center pt-6">
                    <button
                        type="button"
                        onClick={loadMore}
                        disabled={isLoading}
                        className="rounded-md bg-primary px-6 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoading ? "Loading..." : "Load More Pokemon"}
                    </button>
                </div>
            )}

            {!hasMore && visibleItems.length > 0 && (
                <div className="pt-6 text-center text-muted-foreground">
                    You've seen all the Pokemon! 🎉
                </div>
            )}

            {visibleItems.length === 0 && (
                <div className="py-12 text-center">
                    <div className="mb-4 text-6xl">🔍</div>
                    <h3 className="mb-2 font-medium text-lg">
                        No Pokemon found
                    </h3>
                    <p className="text-muted-foreground">
                        Try adjusting your search or filter criteria
                    </p>
                </div>
            )}
        </div>
    );
}
