// Fetch Pokémon list by generation
const fetchPokemonList = async (generation) => {
    try {
        const genRanges = {
            gen1: { limit: 151, offset: 0 },
            gen2: { limit: 100, offset: 151 },
        };
        const { limit, offset } = genRanges[generation];
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
        if (!response.ok) throw new Error('Failed to fetch Pokémon list.');
        const data = await response.json();
        return data.results; // Returns an array of { name, url }
    } catch (error) {
        console.error('Error fetching Pokémon list:', error);
        return [];
    }
};


const displayGallery = async () => {
    const gallery = document.getElementById('pokemonGallery');
    gallery.innerHTML = '<p>Loading Pokémon...</p>';

    try {
        // Fetch Pokémon data for both Gen 1 and Gen 2
        const gen1List = await fetchPokemonList('gen1');
        const gen2List = await fetchPokemonList('gen2');
        const allPokemon = [...gen1List, ...gen2List];

        // Fetch details for each Pokémon and create gallery cards
        const pokemonCards = await Promise.all(
            allPokemon.map(async (pokemon) => {
                const data = await fetchPokemonData(pokemon.name); // Use the name to fetch data
                if (data) return createPokemonCard(data);
                return null;
            })
        );

        gallery.innerHTML = ''; // Clear loading message

        // Append all cards to the gallery
        pokemonCards.forEach((card) => {
            if (card) gallery.appendChild(card);
        });

        if (pokemonCards.length === 0) {
            gallery.innerHTML = '<p>No Pokémon found.</p>';
        }
    } catch (error) {
        console.error('Error displaying gallery:', error);
        gallery.innerHTML = '<p>Failed to load Pokémon. Please try again later.</p>';
    }
};


// Create a Pokémon card with flipping functionality
const createPokemonCard = (pokemon) => {
    const card = document.createElement('div');
    card.classList.add('pokemon-card');

    // Create the inner container for the card
    const cardInner = document.createElement('div');
    cardInner.classList.add('pokemon-card-inner');
    

    // Front of the card
    const cardFront = document.createElement('div');
    cardFront.classList.add('pokemon-card-front');
    cardFront.innerHTML = `
        <h3>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h3>
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
    `;

    // Back of the card (Pokédex entry)
    const cardBack = document.createElement('div');
    cardBack.classList.add('pokemon-card-back');
    cardBack.innerHTML = `
        <h3>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h3>
        <p>Pokédex Entry:</p>
        <p>${pokemon.species.flavor_text}</p>
    `;

    // Append front and back to the card inner
    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);

    // Append the inner container to the card
    card.appendChild(cardInner);

    // Add click event listener to flip the card
    card.addEventListener('click', () => {
        card.classList.toggle('flipped');
    });

    return card;
};


// Fetch Pokémon data (including flavor text for Pokédex entry)
const fetchPokemonData = async (identifier) => {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${identifier.toLowerCase()}`);
        if (!response.ok) throw new Error(`Failed to fetch Pokémon data for ${identifier}.`);
        const pokemonData = await response.json();

        // Fetch species data to get Pokédex entry
        const speciesResponse = await fetch(pokemonData.species.url);
        if (!speciesResponse.ok) throw new Error('Failed to fetch Pokémon species data.');
        const speciesData = await speciesResponse.json();

        // Add a flavor_text field to the Pokémon data
        pokemonData.species.flavor_text = speciesData.flavor_text_entries
        .find((entry) => entry.language.name === 'en')
        .flavor_text.replace(/\s+/g, ' ') // Remove newlines and extra spaces
        .trim(); // Remove trailing and leading whitespace
    

        return pokemonData;
    } catch (error) {
        console.error('Error fetching Pokémon data:', error);
        return null;
    }
};


const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};


const showSuggestions = async (input) => {
    try {
        // Fetch suggestions from both generations
        const gen1Suggestions = await fetchPokemonList('gen1');
        const gen2Suggestions = await fetchPokemonList('gen2');
        const suggestions = [...gen1Suggestions, ...gen2Suggestions];

        const inputValue = input.value.toLowerCase();
        const filteredSuggestions = suggestions.filter((s) =>
            s.name.toLowerCase().startsWith(inputValue)
        );

        const suggestionList = document.getElementById('searchResults');
        suggestionList.innerHTML = '';

        if (filteredSuggestions.length === 0) {
            suggestionList.style.display = 'none';
            return;
        }

        filteredSuggestions.forEach((suggestion) => {
            const suggestionItem = document.createElement('li');
            suggestionItem.innerText = capitalizeFirstLetter(suggestion.name); // Capitalize the first letter
            suggestionItem.onclick = () => handleSuggestionClick(suggestion.name);
            suggestionList.appendChild(suggestionItem);
        });

        suggestionList.style.display = 'block';

        // Hide the suggestions when the mouse leaves the suggestion list
        suggestionList.addEventListener('mouseleave', () => {
            suggestionList.style.display = 'none';
        });

    } catch (error) {
        console.error('Error showing suggestions:', error);
    }
};


const searchPokemon = async (searchInput) => {
    const pokemonName = searchInput.value.toLowerCase().trim();
    if (!pokemonName) return;

    const pokemonData = await fetchPokemonData(pokemonName);
    if (pokemonData) {
        displayPokemonDetails(pokemonData);
    } else {
        alert('Pokémon not found. Please try again.');
    }
};


const handleSuggestionClick = async (name) => {
    const pokemonData = await fetchPokemonData(name);
    if (pokemonData) displayPokemonDetails(pokemonData);

    document.getElementById('pokemonSearch').value = name;
    document.getElementById('searchResults').style.display = 'none';
};


// Display Pokémon details on the Pokédex page
const displayPokemonDetails = (data) => {
    const pokemonGallery = document.getElementById('pokemonGallery');
    if (!pokemonGallery) return;

    pokemonGallery.innerHTML = `
        <h2>${capitalizeFirstLetter(data.name)}</h2>
        <img src="${data.sprites.front_default}">
        <img src="${data.sprites.front_shiny}">
        <audio autoplay style="display: none;" id="pokemonCry">
            <source src="https://pokemoncries.com/cries/${data.id}.mp3" type="audio/mpeg">
            Your browser does not support the audio element.
        </audio>
        <p>HP: ${data.stats[0].base_stat}</p>
        <p>Attack: ${data.stats[1].base_stat}</p>
        <p>Defense: ${data.stats[2].base_stat}</p>
        <p>Special Attack: ${data.stats[3].base_stat}</p>
        <p>Special Defense: ${data.stats[4].base_stat}</p>
        <p>Speed: ${data.stats[5].base_stat}</p>
    `;
     // Adjust audio volume to 30%
    const audioElement = document.getElementById('pokemonCry');
    if (audioElement) {
         audioElement.volume = 0.3; // Set volume to 30%
    }
};


// Initialize search functionality
const initSearch = () => {
    const searchInput = document.getElementById('pokemonSearch');
    const searchButton = document.getElementById('searchButton');

    if (searchInput && searchButton) {
        searchInput.addEventListener('input', (e) => {
            showSuggestions(e.target);
        });

        searchButton.addEventListener('click', () => {
            searchPokemon(searchInput);
        });
    }
};


// Initialize functionality based on the page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('gallery.html')) {
        displayGallery();
    } else if (window.location.pathname.includes('pokedex.html')) {
        initSearch();
    }
});
