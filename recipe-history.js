
recipeId = process.argv[2] || "201"

const request = require("request");

const url = `https://normandy.cdn.mozilla.net/api/v2/recipe/${recipeId}/history/`;

// mozjexl
var Evaluator = require('mozjexl/lib/evaluator/Evaluator'),
  Lexer = require('mozjexl/lib/Lexer'),
  Parser = require('mozjexl/lib/parser/Parser'),
  defaultGrammar = require('mozjexl/lib/grammar').elements;


// this has a bug where it's pushing the arrays 'twice'
function visitTree(jexlParseTree, cb) {
  const out = [];
  cb = cb.bind(null, out);
  const tree = jexlParseTree;
  function visit (tree) {
    if (!tree) {
      return
    }
    cb(tree);
    visit(tree.left, cb);
    visit(tree.right, cb);
  };
  visit(tree, cb);
  return out;
};

function samplingVisitor (out, tree) {
  //console.log(tree);
  if (tree.type != "Transform") return;
  let samplers = ["bucketSample", "stableSample"];
  if (samplers.includes(tree.name)) {
    out.push({
      which: tree.name,
      args: tree.args.map(x=>x.value),
      subject: ["(args before pipe, TBD)"]
    });
    //console.log(out);
  }
};


function describeSampling (aFilterExpression) {
  P = new Parser(defaultGrammar);
  P.addTokens(new Lexer(defaultGrammar).tokenize(aFilterExpression))
  let ans = visitTree(P._tree, samplingVisitor);
  //console.log(ans);
  //debugger;
  return ans;
}

function formatBucketSampleHistory(samples) {
  samples.map(s=>{
    s = s[0];
    console.log(`${s.which}: ${s.args[1]}, starting at ${s.args[0]} ${s.args[2]}`);
  })
}

function formatStableSampleHistory(samples) {

}


function formattedHistory(revs) {
  console.log(`
Name: ${revs[0].recipe.name}
Type: ${revs[0].recipe.action.name}

  `);

  // sampling history
  let sampling = revs.map((r)=>describeSampling(r.recipe.filter_expression));
  debugger;
  switch (sampling[0][0].which) {
    case "bucketSample": {
      formatBucketSampleHistory(sampling);
      break;
    };
    case "stableSample": {
      formatStableSampleHistory(sampling);
      break;
    }
    default:
      console.log(sampling[0])

  }
  //console.log(sampling)
};

request(url,function(a,b,body) {
  revs = JSON.parse(body);
  formattedHistory(revs);
})
