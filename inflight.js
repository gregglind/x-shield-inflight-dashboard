
const normandy = require("./normandy-api");



function inflight (recipeList) {
  let prefs = [];

  recipes=> {
    //console.log(recipes);

    recipes.forEach(function (r) {
      const rtype = r.action.name;
      if (rtype == 'preference-experiment') {
        prefs.push({id, r.r.arguments);
      }
    })
    let out = {
      prefs,
      //optOut,
      //enabled,
    }
    console.log(out.prefs)
    debugger;
  };

}

module.exports = {inflight}

if (require.main === module) {
  console.log('main')
  interestingInflight();
}


