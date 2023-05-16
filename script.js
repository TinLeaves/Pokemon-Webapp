const PAGE_SIZE = 10
let currentPage = 1;
let pokemons = []


function createPaginationButton(text, enabled, onClick, isCurrentPage = false) {

  const updatePokemonCount = (currentPage, PAGE_SIZE, totalPokemons) => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, totalPokemons.length);
    const displayedCount = endIndex - startIndex;
    
    // $('#pokemonCount').text(`Total Pokémon: ${totalPokemons.length}`);
    $('#displayedCount').text(`Showing ${displayedCount} of ${totalPokemons.length} Pokémon`);
  };
  
  updatePokemonCount(currentPage, PAGE_SIZE, pokemons);
  
  const button = $('<li>').addClass('page-item');
  const link = $('<a>').addClass('page-link').text(text).on('click', onClick);
  if (!enabled) {
    button.addClass('disabled');
  }
  if (isCurrentPage) {
    button.addClass('current-page');
  }
  button.append(link);
  return button;
}

const updatePaginationDiv = (currentPage, numPages) => {
  $('#pagination').empty();

  const paginationList = $('<ul>').addClass('pagination justify-content-center');

  const firstButton = createPaginationButton(
    'First',
    currentPage > 1,
    () => changePage(1)
  );
  if (currentPage === 1) {
    firstButton.hide();
  }
  paginationList.append(firstButton);

  const prevButton = createPaginationButton(
    'Previous',
    currentPage > 1,
    () => changePage(currentPage - 1)
  );
  if (currentPage === 1) {
    prevButton.hide();
  }
  paginationList.append(prevButton);

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(startPage + 4, numPages);

  for (let i = startPage; i <= endPage; i++) {
    const pageButton = createPaginationButton(
      i,
      i !== currentPage,
      () => changePage(i)
    );
    if (i === currentPage) {
      pageButton.addClass('current-page');
    }
    paginationList.append(pageButton);
  }

  const nextButton = createPaginationButton(
    'Next',
    currentPage < numPages,
    () => changePage(currentPage + 1)
  );
  if (currentPage === numPages) {
    nextButton.hide();
  }
  paginationList.append(nextButton);

  const lastButton = createPaginationButton(
    'Last',
    currentPage < numPages,
    () => changePage(numPages)
  );
  if (currentPage === numPages) {
    lastButton.hide();
  }
  paginationList.append(lastButton);

  $('#pagination').append(paginationList);
};

function changePage(page) {
  currentPage = page;
  paginate(currentPage, PAGE_SIZE, pokemons);
  updatePaginationDiv(currentPage, Math.ceil(pokemons.length / PAGE_SIZE));
}


const paginate = async (currentPage, PAGE_SIZE, pokemons) => {
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const selected_pokemons = pokemons.slice(startIndex, endIndex);

  $('#pokeCards').empty();
  for (const pokemon of selected_pokemons) {
    const res = await axios.get(pokemon.url);
    $('#pokeCards').append(`
      <div class="pokeCard card" pokeName="${res.data.name}">
        <h3>${res.data.name.toUpperCase()}</h3> 
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
          More
        </button>
      </div>  
    `);
  }
}

const fetchPokemonTypes = async () => {
  try {
    const response = await axios.get('https://pokeapi.co/api/v2/type/');
    const types = response.data.results;
    createTypeCheckboxes(types);
  } catch (error) {
    console.error('Error fetching Pokémon types:', error);
  }
};

const createTypeCheckboxes = (types) => {
  const typeContainer = $('#typeContainer');
  typeContainer.empty();

  for (const type of types) {
    const checkbox = $('<input>')
      .attr('type', 'checkbox')
      .attr('id', type.name)
      .addClass('type-checkbox')
      .on('change', filterPokemonByType);

    const label = $('<label>')
      .attr('for', type.name)
      .text(type.name);

    typeContainer.append(checkbox, label);
  }
};

const fetchPokemonsByType = async (type) => {
  try {
    const response = await axios.get(`https://pokeapi.co/api/v2/type/${type}`);
    const pokemons = response.data.pokemon.map((entry) => entry.pokemon);
    return pokemons;
  } catch (error) {
    console.error(`Error fetching Pokémon of type ${type}:`, error);
    return [];
  }
};

const filterPokemonByType = async () => {
  const checkedTypes = $('.type-checkbox:checked').map(function () {
    return this.id;
  }).get();

  let filteredPokemon = [];

  if (checkedTypes.length > 1) {
    // Fetch the Pokémon for the first selected type
    const pokemonsOfType1 = await fetchPokemonsByType(checkedTypes[0]);

    // Filter the Pokémon that have the second selected type
    filteredPokemon = pokemonsOfType1.filter(pokemon => {
      for (const type of checkedTypes.slice(1)) {
        if (!pokemon.types.some(pokemonType => pokemonType.type.name === type)) {
          return false;
        }
      }
      return true;
    });
  } else if (checkedTypes.length === 1) {
    // Only one type selected, fetch Pokémon for that type
    filteredPokemon = await fetchPokemonsByType(checkedTypes[0]);
  } else {
    // No types selected, return the full list of 810 Pokémon
    const response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
    filteredPokemon = response.data.results;
  }

  const filteredPokemonWithinLimit = filteredPokemon.filter(pokemon => {
    const pokemonNumber = parseInt(pokemon.url.split('/').slice(-2, -1)[0]);
    return pokemonNumber <= 810;
  });

  pokemons = filteredPokemonWithinLimit; // Update the global pokemons array with the filtered data

  currentPage = 1; // Reset the current page to 1
  paginate(currentPage, PAGE_SIZE, pokemons);
  const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages);
};


const setup = async () => {
  // test out poke api using axios here

    // Fetch all Pokémon types
    await fetchPokemonTypes();

  $('#pokeCards').empty()
  let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
  pokemons = response.data.results;


  paginate(currentPage, PAGE_SIZE, pokemons)
  const numPages = Math.ceil(pokemons.length / PAGE_SIZE)
  updatePaginationDiv(currentPage, numPages)



  // pop up modal when clicking on a pokemon card
  // add event listener to each pokemon card
  $('body').on('click', '.pokeCard', async function (e) {
    const pokemonName = $(this).attr('pokeName')
    // console.log("pokemonName: ", pokemonName);
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`)
    // console.log("res.data: ", res.data);
    const types = res.data.types.map((type) => type.type.name)
    // console.log("types: ", types);
    $('.modal-body').html(`
        <div style="width:200px">
        <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
        <div>
        <h3>Abilities</h3>
        <ul>
        ${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}
        </ul>
        </div>

        <div>
        <h3>Stats</h3>
        <ul>
        ${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
        </ul>

        </div>

        </div>
          <h3>Types</h3>
          <ul>
          ${types.map((type) => `<li>${type}</li>`).join('')}
          </ul>
      
        `)
    $('.modal-title').html(`
        <h2>${res.data.name.toUpperCase()}</h2>
        <h5>${res.data.id}</h5>
        `)
  })

  // Add event listener to pagination buttons
  $('body').on('click', '.numberedButtons', async function (e) {
    currentPage = Number(e.target.value);
    paginate(currentPage, PAGE_SIZE, pokemons); // Use the global pokemons array
    updatePaginationDiv(currentPage, Math.ceil(pokemons.length / PAGE_SIZE));
  });

};


$(document).ready(setup)