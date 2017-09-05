const API_ROOT = "https://normandy.cdn.mozilla.net/api/v2";

// https://dashboard.heroku.com/apps/normandy-cors-proxy/deploy/github
const CORS_ROOT = "https://normandy-cors-proxy.herokuapp.com"
function fetchCorsAnywhere(uri) {
  const myHeaders = new Headers({
    "X-Requested-With": "X-Shield-Inflight-Dashboard",
  });
  var myInit = { method: 'GET',
               headers: myHeaders,
               mode: 'cors',
               cache: 'default' };

  uri = `${CORS_ROOT}/${uri}`;
  return fetch(uri, myInit)
}

async function fetchAllRecipes () {
  const API_ROOT = "https://normandy.cdn.mozilla.net/api/v2";
  let url = `${API_ROOT}/recipe/`;
  console.log("loading!", url)
  let recipes = [];
  while (url) {
    let res = await fetchCorsAnywhere(url);
    let data = res.json();
    recipes.concat(data.results);
    url = res.next;
  }
  return recipes;
}

function fetchRecipeHistory (recipeId) {
  const uri = `${API_ROOT}/recipe/${recipeId}/history`;
  console.log("loading!", uri)
  return fetchCorsAnywhere(uri).then((res)=>{
    console.log(res);
    return res.json()
  })}

module.exports = {
  fetchAllRecipes,
  fetchRecipeHistory
}
