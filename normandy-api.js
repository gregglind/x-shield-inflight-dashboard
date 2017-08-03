
const API_ROOT = "https://normandy.cdn.mozilla.net/api/v2";

const request = require("request-promise-native");


function promiseRecipeHistory (recipeNumber) {
  const uri = `${API_ROOT}/recipe/${recipeId}/history/`;
  return request({uri, json:true})
}

function promiseRecipeList () {
  const uri = `${API_ROOT}/recipe/`;
  console.log(`wanting ${uri}`)
  return request({uri, json:true})
}

module.exports = {
  promiseRecipeHistory,
  promiseRecipeList
}
