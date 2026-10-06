import axios from 'axios'

export type PokemonSummary = {
  id: number
  name: string
  sprite: string
}

export type PokemonDetails = PokemonSummary & {
  types: string[]
  height: number
  weight: number
  abilities: string[]
  stats: { name: string; value: number }[]
}

type NamedResource = {
  name: string
  url: string
}

type PokemonResponse = {
  id: number
  name: string
  sprites: {
    front_default: string | null
    other?: {
      'official-artwork'?: { front_default: string | null }
    }
  }
  types: { type: { name: string } }[]
  height: number
  weight: number
  abilities: { ability: { name: string } }[]
  stats: { stat: { name: string }; base_stat: number }[]
}

const apiBase = import.meta.env.DEV ? '/api' : 'https://pokeapi.co/api/v2'

function pokemonIdFromUrl(url: string): number {
  const id = Number(url.match(/\/(\d+)\/?$/)?.[1])
  if (!Number.isInteger(id) || id < 1) {
    throw new Error(`Could not read a Pokémon ID from API URL: ${url}`)
  }
  return id
}

function pokemonSummary(resource: NamedResource): PokemonSummary {
  const id = pokemonIdFromUrl(resource.url)
  return {
    id,
    name: resource.name,
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
  }
}

export async function getPokemon(limit: number): Promise<PokemonSummary[]> {
  if (import.meta.env.DEV) {
    const response = await axios.get<PokemonSummary[]>(`${apiBase}/pokemon`, { params: { limit } })
    return response.data
  }

  const response = await axios.get<{ results: NamedResource[] }>(`${apiBase}/pokemon`, { params: { limit } })
  return response.data.results.map(pokemonSummary)
}

export async function getPokemonTypes(): Promise<string[]> {
  if (import.meta.env.DEV) {
    const response = await axios.get<string[]>(`${apiBase}/types`)
    return response.data
  }

  const response = await axios.get<{ results: NamedResource[] }>(`${apiBase}/type`)
  return response.data.results
    .map(type => type.name)
    .filter(name => !['unknown', 'shadow'].includes(name))
}

export async function getPokemonByType(type: string): Promise<PokemonSummary[]> {
  if (import.meta.env.DEV) {
    const response = await axios.get<PokemonSummary[]>(`${apiBase}/pokemon/type/${type}`)
    return response.data
  }

  const response = await axios.get<{ pokemon: { pokemon: NamedResource }[] }>(`${apiBase}/type/${type}`)
  return response.data.pokemon
    .map(entry => pokemonSummary(entry.pokemon))
    .filter(pokemon => pokemon.id <= 1025)
}

export async function getPokemonDetails(name: string): Promise<PokemonDetails> {
  if (import.meta.env.DEV) {
    const response = await axios.get<PokemonDetails>(`${apiBase}/pokemon/${name}`)
    return response.data
  }

  const response = await axios.get<PokemonResponse>(`${apiBase}/pokemon/${name}`)
  const pokemon = response.data
  const summary = {
    id: pokemon.id,
    name: pokemon.name,
    sprite: pokemon.sprites.other?.['official-artwork']?.front_default
      ?? pokemon.sprites.front_default
      ?? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`,
  }

  return {
    ...summary,
    types: pokemon.types.map(entry => entry.type.name),
    height: pokemon.height,
    weight: pokemon.weight,
    abilities: pokemon.abilities.map(entry => entry.ability.name),
    stats: pokemon.stats.map(entry => ({ name: entry.stat.name, value: entry.base_stat })),
  }
}
