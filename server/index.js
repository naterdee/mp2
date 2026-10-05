import express from 'express';
import cors from 'cors';

const app = express();
const PORT = Number(process.env.PORT) || 5001;

app.use(cors());
app.use(express.json());

app.get('/api/pokemon', async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 151, 1), 1025);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
    if (!response.ok) return res.status(response.status).json({ error: 'Failed to load Pokemon' });
    const data = await response.json();

    res.json(data.results.map(pokemon => {
      const id = Number(pokemon.url.match(/\/(\d+)\/$/)?.[1]);
      return {
        id,
        name: pokemon.name,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      };
    }));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from PokeAPI' });
  }
});

app.get('/api/types', async (req, res) => {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/type');
    if (!response.ok) return res.status(response.status).json({ error: 'Failed to load types' });
    const data = await response.json();
    res.json(data.results.map(type => type.name).filter(name => !['unknown', 'shadow'].includes(name)));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from PokeAPI' });
  }
});

app.get('/api/pokemon/type/:type', async (req, res) => {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/type/${req.params.type.toLowerCase()}`);
    if (!response.ok) return res.status(response.status).json({ error: 'Pokemon type not found' });
    const data = await response.json();
    res.json(data.pokemon.map(entry => {
      const pokemon = entry.pokemon;
      const id = Number(pokemon.url.match(/\/(\d+)\/$/)?.[1]);
      return {
        id,
        name: pokemon.name,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      };
    }).filter(pokemon => pokemon.id <= 1025));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from PokeAPI' });
  }
});

app.get('/api/pokemon/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
    if (!response.ok) return res.status(404).json({ error: 'Pokemon not found' });
    const data = await response.json();
    
    res.json({
      id: data.id,
      name: data.name,
      sprite: data.sprites.other['official-artwork'].front_default,
      types: data.types.map(t => t.type.name),
      height: data.height,
      weight: data.weight,
      abilities: data.abilities.map(ability => ability.ability.name),
      stats: data.stats.map(stat => ({ name: stat.stat.name, value: stat.base_stat })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from PokeAPI' });
  }
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));