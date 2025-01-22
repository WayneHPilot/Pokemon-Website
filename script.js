// Array of themes to toggle through
const themes = ['default-theme', 'fire-theme', 'water-theme', 'grass-theme'];
let currentThemeIndex = 0;

// Function to toggle themes
function toggleTheme() {
    console.log('toggleTheme function triggered'); // Debugging log
    const body = document.body;

    // Remove the current theme
    body.classList.remove(themes[currentThemeIndex]);

    // Move to the next theme
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;

    // Add the new theme
    body.classList.add(themes[currentThemeIndex]);

    // Save the selected theme in localStorage
    localStorage.setItem('selectedTheme', themes[currentThemeIndex]);
}

// Apply the saved theme when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed'); // Debugging log
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme && themes.includes(savedTheme)) {
        document.body.classList.add(savedTheme);
        currentThemeIndex = themes.indexOf(savedTheme);
    }
});


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

// Fetch detailed Pokémon data (including abilities, types, and evolution chain)
const fetchPokemonData = async (identifier) => {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${identifier.toLowerCase()}`);
        if (!response.ok) throw new Error(`Failed to fetch Pokémon data for ${identifier}.`);
        const pokemonData = await response.json();

        // Fetch species data to get Pokédex entry and evolutions
        const speciesResponse = await fetch(pokemonData.species.url);
        if (!speciesResponse.ok) throw new Error('Failed to fetch Pokémon species data.');
        const speciesData = await speciesResponse.json();

        // Fetch evolution chain
        const evolutionChainResponse = await fetch(speciesData.evolution_chain.url);
        if (!evolutionChainResponse.ok) throw new Error('Failed to fetch evolution chain.');
        const evolutionChainData = await evolutionChainResponse.json();

        // Add a flavor_text field to the Pokémon data
        pokemonData.species.flavorText = speciesData.flavor_text_entries
            .find((entry) => entry.language.name === 'en')
            .flavor_text.replace(/\s+/g, ' ') // Remove newlines and extra spaces
            .trim(); // Remove trailing and leading whitespace

        return { pokemonData, evolutionChainData };
    } catch (error) {
        console.error('Error fetching Pokémon data:', error);
        return null;
    }
};

// Create a flipping Pokémon card
const createPokemonCard = (pokemon) => {
    const card = document.createElement('div');
    card.classList.add('pokemon-card');

    const cardInner = document.createElement('div');
    cardInner.classList.add('pokemon-card-inner');

    // Front of the card
    const cardFront = document.createElement('div');
    cardFront.classList.add('pokemon-card-front');
    cardFront.innerHTML = `
        <h3>${capitalizeFirstLetter(pokemon.name)}</h3>
        <img src="${pokemon.sprite}" alt="${pokemon.name}">
    `;

    // Back of the card (Pokédex entry)
    const cardBack = document.createElement('div');
    cardBack.classList.add('pokemon-card-back');
    cardBack.innerHTML = `
        <h3>${capitalizeFirstLetter(pokemon.name)}</h3>
        <p>${pokemon.flavorText}</p>
    `;

    // Append front and back to the card inner
    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);

    // Add flipping functionality
    card.addEventListener('click', () => {
        card.classList.toggle('flipped');
    });

    card.appendChild(cardInner);
    return card;
};

// Display Pokémon details on the Pokédex page with Typing, Abilities, and Stats columns
const displayPokemonDetails = (data) => {
    const pokemonGallery = document.getElementById('pokemonGallery');
    if (!pokemonGallery) return;

    const { pokemonData, evolutionChainData } = data;

    // Display Pokémon details (typing, abilities, evolution, sprites)
    pokemonGallery.innerHTML = `
        <h2>${capitalizeFirstLetter(pokemonData.name)}</h2>
        <div class="pokemon-sprites">
            <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name} Sprite">
            <img src="${pokemonData.sprites.front_shiny}" alt="${pokemonData.name} Shiny Sprite">
        </div>

        <div class="pokemon-details">
            <div class="pokemon-left">
                <h4>Typing</h4>
                <ul>
                    ${pokemonData.types.map((type) => `<li>${capitalizeFirstLetter(type.type.name)}</li>`).join('')}
                </ul>

                <h4>Abilities</h4>
                <ul>
                    ${pokemonData.abilities.map((ability) => `<li>${capitalizeFirstLetter(ability.ability.name)}</li>`).join('')}
                </ul>

                <h4>Evolution Line</h4>
                <ul class="evolution-chain">
                    ${getEvolutionSprites(evolutionChainData.chain)}
                </ul>
            </div>

            <div class="pokemon-right">
                <h4>Stats</h4>
                ${getStatBar("HP", pokemonData.stats[0].base_stat)}
                ${getStatBar("Attack", pokemonData.stats[1].base_stat)}
                ${getStatBar("Defense", pokemonData.stats[2].base_stat)}
                ${getStatBar("Special Attack", pokemonData.stats[3].base_stat)}
                ${getStatBar("Special Defense", pokemonData.stats[4].base_stat)}
                ${getStatBar("Speed", pokemonData.stats[5].base_stat)}
            </div>
        </div>

        <audio autoplay style="display: none;" id="pokemonCry">
            <source src="https://pokemoncries.com/cries/${pokemonData.id}.mp3" type="audio/mpeg">
            Your browser does not support the audio element.
        </audio>
    `;

    // Adjust audio volume to 30%
    const audioElement = document.getElementById('pokemonCry');
    if (audioElement) {
        audioElement.volume = 0.3; // Set volume to 30%
    }

    // Animate progress bars after 2 seconds (timeout)
    setTimeout(() => {
        animateStats(pokemonData.stats);
    }, 500);
};

// Helper function to generate the evolution sprites
const getEvolutionSprites = (chain) => {
    let evolutions = [];
    while (chain) {
        // Fetching the evolution sprite using the Pokémon ID from the URL
        const pokemonId = chain.species.url.split('/')[6];
        evolutions.push(`
            <li>
                <span class="evolution-name">${capitalizeFirstLetter(chain.species.name)}</span>
                <img class="evolution-sprite" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png" alt="${chain.species.name} sprite">
            </li>
        `);
        chain = chain.evolves_to[0]; // Get the next evolution if it exists
    }
    return `<ul class="evolution-chain">${evolutions.join('')}</ul>`;
};

// Helper function to create a stat bar
const getStatBar = (statName, value) => {
    // Max stat value is 255 (Pokémon stat limits)
    const maxStatValue = 255;
    const width = (value / maxStatValue) * 100; // Percentage width based on stat value

    return `
        <div class="stat-bar">
            <label for="${statName}">${statName}</label>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: 0%;"></div> <!-- Initial width set to 0% -->
                <span class="stat-value">${value}</span>
            </div>
        </div>
    `;
};

// Animate the progress bars after the Pokémon data is displayed
const animateStats = (stats) => {
    stats.forEach((stat, index) => {
        const progressBar = document.querySelectorAll('.progress-bar')[index];
        const statValue = stat.base_stat;

        // Animate the progress bar width from 0 to the actual stat value
        progressBar.style.transition = 'width 2s ease-in-out';
        progressBar.style.width = `${(statValue / 255) * 100}%`;
    });
};

// Search and display Pokémon by name
const searchPokemon = async (searchInput) => {
    const pokemonName = searchInput.value.toLowerCase().trim();
    if (!pokemonName) return;

    const data = await fetchPokemonData(pokemonName);
    if (data) {
        displayPokemonDetails(data);
    } else {
        alert('Pokémon not found. Please try again.');
    }
};

// Handle search input and display suggestions
const handleSuggestionClick = async (name) => {
    const data = await fetchPokemonData(name);
    if (data) displayPokemonDetails(data);

    document.getElementById('pokemonSearch').value = name;
    document.getElementById('searchResults').style.display = 'none';
};

// Display Pokémon suggestions based on input
const showSuggestions = async (input) => {
    try {
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
            suggestionItem.innerText = capitalizeFirstLetter(suggestion.name);
            suggestionItem.onclick = () => handleSuggestionClick(suggestion.name);
            suggestionList.appendChild(suggestionItem);
        });

        suggestionList.style.display = 'block';

        suggestionList.addEventListener('mouseleave', () => {
            suggestionList.style.display = 'none';
        });
    } catch (error) {
        console.error('Error showing suggestions:', error);
    }
};

// Initialize search functionality for Pokédex
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

// Initialize gallery page functionality
const displayGallery = async () => {
    const gallery = document.getElementById('pokemonGallery');
    gallery.innerHTML = '<p>Loading Pokémon...</p>';

    try {
        const gen1List = await fetchPokemonList('gen1');
        const gen2List = await fetchPokemonList('gen2');
        const allPokemon = [...gen1List, ...gen2List];

        const pokemonCards = await Promise.all(
            allPokemon.map(async (pokemon) => {
                const data = await fetchPokemonDataForGallery(pokemon.name);
                if (data) return createPokemonCard(data);
                return null;
            })
        );

        gallery.innerHTML = '';

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

// Fetch detailed data for gallery page
const fetchPokemonDataForGallery = async (identifier) => {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${identifier.toLowerCase()}`);
        if (!response.ok) throw new Error(`Failed to fetch Pokemon data for ${identifier}.`);
        const data = await response.json();

        // Fetch species data for Pokédex entry
        const speciesResponse = await fetch(data.species.url);
        if (!speciesResponse.ok) throw new Error('Failed to fetch Pokémon species data.');
        const speciesData = await speciesResponse.json();

        return {
            name: data.name,
            id: data.id,
            sprite: data.sprites.front_default,
            flavorText: speciesData.flavor_text_entries
                .find((entry) => entry.language.name === 'en')
                .flavor_text.replace(/\s+/g, ' ') // Remove newlines and extra spaces
                .trim(), // Remove trailing and leading whitespace
        };
    } catch (error) {
        console.error('Error fetching Pokémon data:', error);
        return null;
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

// Helper function to capitalize the first letter
const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    const formMessage = document.getElementById('formMessage');

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent the default form submission behavior

            // Retrieve form values
            const name = form.elements['name'].value.trim();
            const email = form.elements['email'].value.trim();
            const message = form.elements['message'].value.trim();

            // Validate the inputs
            if (!name || !email || !message) {
                alert('Please fill in all fields.');
                return;
            }

            // Log the form data (simulating form submission)
            console.log('Form submitted!', { name, email, message });

            // Clear the form
            form.reset();

            // Show success message
            formMessage.style.display = 'block';

            // Hide the success message after 3 seconds
            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 3000);
        });
    }
});