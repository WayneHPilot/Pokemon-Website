// ===============================
// Audio functionality
// ===============================
const bgm = new Audio('PalletTown.mp3');
bgm.loop = true;
bgm.volume = 0.25;

let isMuted = localStorage.getItem('isMuted') === 'true';
let lastPlayedTime = localStorage.getItem('lastPlayedTime') || 0;

bgm.currentTime = lastPlayedTime; // Set the current time when the page loads
bgm.muted = isMuted;

// Play music when allowed
const playMusic = () => {
	bgm.play().catch(() => {
		// Listen for the first user interaction to play music
		document.addEventListener('click', () => bgm.play(), { once: true });
	});
};

// Update mute button state and audio state
const updateMuteState = () => {
	const muteBtn = document.getElementById('muteBtn');
	if (muteBtn) {
		muteBtn.innerHTML = isMuted
			? '<i class="fa-solid fa-volume-xmark"></i>'  // Muted icon
			: '<i class="fa-solid fa-volume-high"></i>';  // Unmuted icon
	}

	bgm.muted = isMuted;
};

// Handle mute toggle
const toggleMute = () => {
	isMuted = !isMuted;
	bgm.muted = isMuted;
	localStorage.setItem('isMuted', isMuted);
	updateMuteState();
};

// Store the time when the user leaves the page
const savePlayTime = () => {
	localStorage.setItem('lastPlayedTime', bgm.currentTime);
};

// Ensure music plays and settings persist across pages
window.addEventListener('load', () => {
	playMusic();
	updateMuteState();
});

// When the user navigates away, store the current time
window.addEventListener('beforeunload', () => {
	savePlayTime();
});

// Toggle mute when button is clicked
const muteBtn = document.getElementById('muteBtn');
if (muteBtn) {
	muteBtn.addEventListener('click', toggleMute);
}

// ===============================
// Theme toggling functionality
// ===============================
const themes = ['defaultTheme', 'fireTheme', 'waterTheme', 'grassTheme'];
let currentThemeIndex = 0;

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

// ===============================
// Apply the saved theme when the page loads
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed'); // Debugging log
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme && themes.includes(savedTheme)) {
        document.body.classList.add(savedTheme);
        currentThemeIndex = themes.indexOf(savedTheme);
    }
});

// ===============================
// Helper function to capitalize the first letter
// ===============================
const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

// ===============================
// Fetch Pokémon list by generation
// ===============================
const fetchPokemonList = async (generation) => {
    try {
        const genRanges = {
            gen1: { limit: 151, offset: 0 },
            gen2: { limit: 100, offset: 151 },
            gen3: { limit: 135, offset: 251 },
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

// ===============================
// Fetch detailed Pokémon data
// ===============================
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

// ===============================
// Create a flipping Pokémon card
// ===============================
const createPokemonCard = (pokemon) => {
    const card = document.createElement('div');
    card.classList.add('pokemonCard');

    const cardInner = document.createElement('div');
    cardInner.classList.add('pokemonCardInner');

    // Front of the card
    const cardFront = document.createElement('div');
    cardFront.classList.add('pokemonCardFront');
    cardFront.innerHTML = `
        <h3>${capitalizeFirstLetter(pokemon.name)}</h3>
        <img src="${pokemon.sprite}" alt="${pokemon.name}">
    `;

    // Back of the card (Pokédex entry)
    const cardBack = document.createElement('div');
    cardBack.classList.add('pokemonCardBack');
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

// ===============================
// Helper function to generate evolution sprites
// ===============================
const getEvolutionSprites = (chain) => {
    const evolutions = [];

    const traverseEvolutionChain = (node) => {
        if (node) {
            const pokemonId = node.species.url.split('/')[6];
            evolutions.push(`
                <li>
                    <span class="evolutionName">${capitalizeFirstLetter(node.species.name)}</span>
                    <img class="evolutionSprite" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png" alt="${node.species.name} sprite">
                </li>
            `);

            node.evolves_to.forEach(traverseEvolutionChain); // Handle multiple evolutions
        }
    };

    traverseEvolutionChain(chain);
    return `<ul class="evolutionChain">${evolutions.join('')}</ul>`;
};

// ===============================
// Helper function to create a stat bar
// ===============================
const getStatBar = (statName, value) => {
    const maxStatValue = 255;
    const width = (value / maxStatValue) * 100;

    return `
        <div class="statBar">
            <label for="${statName}">${statName}</label>
            <div class="progressBarContainer">
                <div class="progressBar" style="width: 0%;"></div>
                <span class="statValue">${value}</span>
            </div>
        </div>
    `;
};

// ===============================
// Animate the progress bars after the Pokémon data is displayed
// ===============================
const animateStats = (stats) => {
    stats.forEach((stat, index) => {
        const progressBar = document.querySelectorAll('.progressBar')[index];
        const statValue = stat.base_stat;

        progressBar.style.transition = 'width 2s ease-in-out';
        progressBar.style.width = `${(statValue / 255) * 100}%`;
    });
};

// ===============================
// Display Pokémon details
// ===============================
const displayPokemonDetails = (data) => {
    const pokemonGallery = document.getElementById('pokemonGallery');
    if (!pokemonGallery) return;

    const { pokemonData, evolutionChainData } = data;

    pokemonGallery.innerHTML = `
        <h2>${capitalizeFirstLetter(pokemonData.name)}</h2>
        <div class="pokemonSprites">
            <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name} Sprite">
            <img src="${pokemonData.sprites.front_shiny}" alt="${pokemonData.name} Shiny Sprite">
        </div>

        <div class="pokemonDetails">
            <div class="pokemonLeft">
                <h4>Typing</h4>
                <ul>
                    ${pokemonData.types.map((type) => `<li>${capitalizeFirstLetter(type.type.name)}</li>`).join('')}
                </ul>

                <h4>Abilities</h4>
                <ul>
                    ${pokemonData.abilities.map((ability) => `<li>${capitalizeFirstLetter(ability.ability.name)}</li>`).join('')}
                </ul>

                <h4>Evolution Line</h4>
                ${getEvolutionSprites(evolutionChainData.chain)}
            </div>

            <div class="pokemonRight">
                <h4>Stats</h4>
                ${getStatBar("HP", pokemonData.stats[0].base_stat)}
                ${getStatBar("Attack", pokemonData.stats[1].base_stat)}
                ${getStatBar("Defense", pokemonData.stats[2].base_stat)}
                ${getStatBar("SpecialAttack", pokemonData.stats[3].base_stat)}
                ${getStatBar("SpecialDefense", pokemonData.stats[4].base_stat)}
                ${getStatBar("Speed", pokemonData.stats[5].base_stat)}
            </div>
        </div>

        <audio autoplay style="display: none;" id="pokemonCry">
            <source src="https://pokemoncries.com/cries/${pokemonData.id}.mp3" type="audio/mpeg">
            Your browser does not support the audio element.
        </audio>
    `;

    const audioElement = document.getElementById('pokemonCry');
    if (audioElement) {
        audioElement.volume = 0.3;
    }

    setTimeout(() => {
        animateStats(pokemonData.stats);
    }, 500);
};


// ===============================
// Search and display Pokémon by name
// ===============================
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

// ===============================
// Handle search input and display suggestions
// ===============================
const handleSuggestionClick = async (name) => {
    const data = await fetchPokemonData(name);
    if (data) displayPokemonDetails(data);

    document.getElementById('pokemonSearch').value = name;
    document.getElementById('searchResults').style.display = 'none';
};

// ===============================
// Display Pokémon suggestions based on input
// ===============================
const showSuggestions = async (input) => {
    try {
        const gen1Suggestions = await fetchPokemonList('gen1');
        const gen2Suggestions = await fetchPokemonList('gen2');
        const gen3Suggestions = await fetchPokemonList('gen3');
        const suggestions = [...gen1Suggestions, ...gen2Suggestions, ...gen3Suggestions];

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

// ===============================
// Initialize search functionality for Pokédex
// ===============================
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

// ===============================
// Initialize gallery page functionality
// ===============================
const displayGallery = async () => {
    const gallery = document.getElementById('pokemonGallery');
    gallery.innerHTML = '<p>Loading Pokémon...</p>';

    try {
        const gen1List = await fetchPokemonList('gen1');
        const gen2List = await fetchPokemonList('gen2');
        const gen3List = await fetchPokemonList('gen3');
        const allPokemon = [...gen1List, ...gen2List, ...gen3List];

        const pokemonCards = await Promise.all(
            allPokemon.map(async (pokemon) => {
                const data = await fetchPokemonDataForGallery(pokemon.name);
                if (data) {
                    return createPokemonCard(data);
                } else {
                    console.log('No data found for:', pokemon.name);  // Debug log
                    return null;
                }
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

// ===============================
// Fetch detailed data for gallery page
// ===============================
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

// ===============================
// Initialize functionality based on the page
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('gallery.html')) {
        displayGallery();
    } else if (window.location.pathname.includes('pokedex.html')) {
        initSearch();
    }
});


