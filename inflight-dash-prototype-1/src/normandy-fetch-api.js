const API_ROOT = "https://normandy.cdn.mozilla.net/api/v2";

function fetchCorsAnywhere(uri) {
  const myHeaders = new Headers({
    "X-Requested-With": "X-Shield-Inflight-Dashboard",
  });
  var myInit = { method: 'GET',
               headers: myHeaders,
               mode: 'cors',
               cache: 'default' };

  const CORS_ANYWHERE = "https://cors-anywhere.herokuapp.com"
  uri = `${CORS_ANYWHERE}/${uri}`;
  return fetch(uri, myInit)
}

function fetchAllRecipes () {
  const API_ROOT = "https://normandy.cdn.mozilla.net/api/v2";
  const uri = `${API_ROOT}/recipe/`;
  console.log("loading!", uri)
  return fetchCorsAnywhere(uri).then((res)=>res.json())
}

function fetchRecipeHistory (recipeId) {
  const uri = `${API_ROOT}/recipe/${recipeId}/history`;
  console.log("loading!", uri)
  return fetchCorsAnywhere(uri).then((res)=>res.json())
}

module.exports = {
  fetchAllRecipes,
  fetchRecipeHistory
}
