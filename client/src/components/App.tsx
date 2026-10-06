import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import {
  getPokemon,
  getPokemonByType,
  getPokemonDetails,
  getPokemonTypes,
} from '../api/pokemon'
import type { PokemonDetails, PokemonSummary } from '../api/pokemon'
import './App.css'

type PokemonDetailResult =
  | { name: string; status: 'loaded'; data: PokemonDetails }
  | { name: string; status: 'error'; message: string }

function App() {
  const [pokemon, setPokemon] = useState<PokemonSummary[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState('all')
  const [typePokemon, setTypePokemon] = useState<PokemonSummary[]>([])
  const [loadedType, setLoadedType] = useState('all')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'id' | 'name'>('id')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [view, setView] = useState<'gallery' | 'list'>('gallery')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typeError, setTypeError] = useState('')

  useEffect(() => {
    Promise.all([
      getPokemon(151),
      getPokemonTypes(),
    ]).then(([pokemonResults, pokemonTypes]) => {
      setPokemon(pokemonResults)
      setTypes(pokemonTypes)
    }).catch(() => setError('Could not load Pokémon data. Check your connection and try again.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let active = true
    if (selectedType === 'all') return () => { active = false }
    getPokemonByType(selectedType)
      .then(results => {
        if (active) {
          setTypePokemon(results)
          setLoadedType(selectedType)
          setTypeError('')
        }
      })
      .catch(() => {
        if (active) {
          setTypePokemon([])
          setLoadedType(selectedType)
          setTypeError(`Could not load ${selectedType} Pokémon.`)
        }
      })
    return () => { active = false }
  }, [selectedType])

  const typeLoading = selectedType !== 'all' && loadedType !== selectedType
  const visibleError = error || (selectedType === 'all' ? '' : typeError)
  const visiblePokemon = useMemo(() => {
    const source = selectedType === 'all'
      ? pokemon
      : loadedType === selectedType ? typePokemon : []
    return source
      .filter(item => item.id <= 151 && item.name.includes(query.trim().toLowerCase()))
      .sort((first, second) => {
        const comparison = sortBy === 'name'
          ? first.name.localeCompare(second.name)
          : first.id - second.id
        return order === 'asc' ? comparison : -comparison
      })
  }, [loadedType, order, pokemon, query, selectedType, sortBy, typePokemon])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="app-shell">
        <header className="topbar">
          <Link className="wordmark" to="/" aria-label="PokéApp home">
            <span className="brand-mark" aria-hidden="true"><i /></span>
            <span>POKÉAPP</span>
          </Link>
          <span className="topbar-note">Complete Kanto Pokédex</span>
          <span className={`api-status${visibleError ? ' error' : loading ? ' loading' : ''}`}><i />{visibleError ? 'API ERROR' : loading ? 'API CONNECTING' : 'API CONNECTED'}</span>
        </header>

        <Routes>
          <Route path="/" element={
            <main className="explorer">
              <section className="intro">
                <div className="intro-copy">
                  <p className="eyebrow">THE ORIGINAL 151</p>
                  <h1>Explore the Kanto Pokédex</h1>
                  <p className="intro-text">Meet the Pokémon of the Kanto region. Search, sort, and find your next favorite.</p>
                </div>
                <div className="intro-art" aria-hidden="true">
                  <div className="art-ring" />
                  <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" alt="" />
                  <span className="art-caption">NO. 025 <b>PIKACHU</b></span>
                </div>
                <div className="intro-index">#<strong>001</strong><span>—</span>#<strong>151</strong></div>
              </section>

              <section className="catalog" aria-label="Pokémon catalog">
                <div className="catalog-heading">
                  <div>
                    <p className="eyebrow">THE COLLECTION</p>
                    <h2>Find your Pokémon</h2>
                  </div>
                  <span className="result-count">{loading ? 'LOADING' : `${visiblePokemon.length} RESULTS`}</span>
                </div>

                <div className="toolbar">
                  <label className="search-box">
                    <span aria-hidden="true">⌕</span>
                    <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name..." aria-label="Search Pokémon by name" />
                    {query && <button type="button" className="clear-search" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
                  </label>
                  <label className="select-control">
                    <span>TYPE</span>
                    <select value={selectedType} onChange={event => setSelectedType(event.target.value)} aria-label="Filter by type">
                      <option value="all">All types</option>
                      {types.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  <label className="select-control sort-control">
                    <span>SORT</span>
                    <select value={sortBy} onChange={event => setSortBy(event.target.value === 'name' ? 'name' : 'id')} aria-label="Sort Pokémon">
                      <option value="id">Number</option>
                      <option value="name">Name</option>
                    </select>
                  </label>
                  <button className="order-button" type="button" onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')} aria-label={`Sort ${order === 'asc' ? 'descending' : 'ascending'}`} title={order === 'asc' ? 'Ascending' : 'Descending'}>
                    {order === 'asc' ? '↑' : '↓'}
                  </button>
                  <div className="view-toggle" role="group" aria-label="Result view">
                    <button type="button" className={view === 'gallery' ? 'active' : ''} onClick={() => setView('gallery')} aria-label="Gallery view" title="Gallery view">▦</button>
                    <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="List view" title="List view">☷</button>
                  </div>
                </div>

                {visibleError && <p className="notice" role="alert">{visibleError}</p>}
                {loading || typeLoading ? <div className="loading-state">Finding the field guide...</div> : visiblePokemon.length ? (
                  <div className={view === 'gallery' ? 'pokemon-grid' : 'pokemon-list'}>
                    {visiblePokemon.map((item, index) => (
                      <Link className="pokemon-card" to={`/pokemon/${item.name}`} key={item.id}>
                        <div className="card-art">
                          <span className="card-number">Nº {String(item.id).padStart(3, '0')}</span>
                          <img src={item.sprite} alt={item.name} loading={index > 15 ? 'lazy' : 'eager'} />
                          <span className="card-arrow" aria-hidden="true">↗</span>
                        </div>
                        <div className="card-label"><span>{item.name}</span><span>#{String(item.id).padStart(3, '0')}</span></div>
                      </Link>
                    ))}
                  </div>
                ) : <div className="empty-state"><span>?</span><h3>No Pokémon found</h3><p>Try another name or type.</p></div>}
              </section>
            </main>
          } />
          <Route path="/pokemon/:name" element={<PokemonDetail pokemon={pokemon} />} />
          <Route path="*" element={<main className="not-found"><p className="eyebrow">404 · OFF THE MAP</p><h1>That trail went cold.</h1><Link className="back-link" to="/">Back to the field guide</Link></main>} />
        </Routes>

        <footer className="footer"><span>POKÉAPP FIELD GUIDE</span><span>DATA FROM POKEAPI.CO</span><span>© 2026</span></footer>
      </div>
    </BrowserRouter>
  )
}

function PokemonDetail({ pokemon }: { pokemon: PokemonSummary[] }) {
  const { name = '' } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState<PokemonDetailResult | null>(null)

  useEffect(() => {
    let active = true
    getPokemonDetails(name).then(details => {
      if (active) setResult({ name, status: 'loaded', data: details })
    }).catch(() => {
      if (active) setResult({ name, status: 'error', message: 'This Pokémon could not be found.' })
    })
    return () => { active = false }
  }, [name])

  const index = pokemon.findIndex(item => item.name === name)
  const previous = pokemon[index > 0 ? index - 1 : pokemon.length - 1]
  const next = pokemon[index >= 0 && index < pokemon.length - 1 ? index + 1 : 0]

  if (!result || result.name !== name) return <main className="detail-page"><div className="loading-state">Opening the field guide...</div></main>
  if (result.status === 'error') return <main className="detail-page"><p className="notice" role="alert">{result.message}</p><Link className="back-link" to="/">Back to the field guide</Link></main>

  const details = result.data
  return (
    <main className="detail-page">
      <Link className="back-link" to="/">← All Pokémon</Link>
      <div className="detail-layout">
        <section className="detail-art">
          <span className="detail-number">NO. {String(details.id).padStart(3, '0')}</span>
          <div className="detail-orbit" />
          <img src={details.sprite} alt={details.name} />
          <div className="detail-type-row">{details.types.map(type => <span className={`type-chip type-${type}`} key={type}>{type}</span>)}</div>
        </section>
        <section className="detail-info">
          <h1>{details.name}</h1>
          <p className="detail-subtitle">Find basic information about this Pokémon below.</p>
          <div className="measurements">
            <div><span>HEIGHT</span><strong>{(details.height / 10).toFixed(1)} <small>m</small></strong></div>
            <div><span>WEIGHT</span><strong>{(details.weight / 10).toFixed(1)} <small>kg</small></strong></div>
          </div>
          <div className="detail-section"><h2>Base stats</h2>
            {details.stats.map(stat => <div className="stat-row" key={stat.name}><span>{stat.name.replace('-', ' ')}</span><strong>{stat.value}</strong><progress className="stat-track" value={stat.value} max={255} aria-label={`${stat.name} ${stat.value}`} /></div>)}
          </div>
          <div className="detail-section abilities"><h2>Abilities</h2><div>{details.abilities.map(ability => <span key={ability}>{ability.replace('-', ' ')}</span>)}</div></div>
          <nav className="detail-nav" aria-label="Browse Pokémon">
            <button type="button" onClick={() => previous && navigate(`/pokemon/${previous.name}`)} disabled={!previous}><span className="nav-arrow">←</span><span className="nav-label">PREVIOUS</span></button>
            <button type="button" onClick={() => next && navigate(`/pokemon/${next.name}`)} disabled={!next}><span className="nav-label">NEXT</span><span className="nav-arrow">→</span></button>
          </nav>
        </section>
      </div>
    </main>
  )
}

export default App