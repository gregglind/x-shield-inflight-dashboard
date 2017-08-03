const VERSION = require("./package.json").version;

/* Goals

For each REV of a RECIPE:
- DATE
- Comment
- STATUS:
  - active | draft | approval | ???
- did sampling change
  - size
  - locales etc
- current sampling
*/

const recipeId = process.argv[2] || "201"

const request = require("request");
const moustache = require("moustache");
const moment = require("moment");
const equal = require('deep-equal');
const url = `https://normandy.cdn.mozilla.net/api/v2/recipe/${recipeId}/history/`;

// mozjexl
//var Evaluator = require('mozjexl/lib/evaluator/Evaluator'),
var  Lexer = require('mozjexl/lib/Lexer'),
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
  }
  visit(tree, cb);
  return out;
}

function samplingVisitor (out, tree) {
  //console.log(tree);
  if (tree.type != "Transform") return;
  const samplers = ["bucketSample", "stableSample"];
  if (samplers.includes(tree.name)) {
    out.push({
      which: tree.name,
      args: tree.args.map(x=>x.value),
      subject: ["(args before pipe, TBD)"]
    });
    //console.log(out);
  }
}

function describeSampling (aFilterExpression) {
  const P = new Parser(defaultGrammar);
  P.addTokens(new Lexer(defaultGrammar).tokenize(aFilterExpression))
  const ans = visitTree(P._tree, samplingVisitor);
  //console.log(ans);
  //debugger;
  return ans;
}

function describeStatus (rev) {
  const out = {
    enabled: rev.recipe.enabled,
    approved: rev.recipe.is_approved
  }
  const ar = rev.approval_request;
  if (ar) {
    out.creator = ar.creator.email;
    out.approver = (ar.approver || {}).email;
    out.comment =ar.comment;
  }
  return out;
}

function formatSample(s) {
  s = s[0];  // the first sampling thing we see.
  switch (s.which) {
    case "bucketSample": {
      return `${s.which}: ${s.args[1]}, starting at ${s.args[0]} ${s.args[2]}`;
    }
    case "stableSample": {
      return JSON.stringify(s);
    }
    default:
      return JSON.stringify(s);
  }
}


function formattedHistory(revs) {
  console.log(`
Name: ${revs[0].recipe.name}
Type: ${revs[0].recipe.action.name}`);

  const xtype = revs[0].recipe.action.name;
  switch (xtype) {
    case "preference-experiment": {
      console.log(revs[0].recipe.arguments);
      break;
    }
    default: {
      console.log(revs[0].recipe.arguments);
    }
  }
  // Go through each rev, and start creating TAGS for those revs
  // 1. sampling
  const sampling = revs.map((r)=>describeSampling(r.recipe.filter_expression));
  // 2. date
  // 3. status
  const status = revs.map((r)=>describeStatus(r));

  // loop through all the these together to create a FORMATTED HISTORY
  function formatRev (ii, context) {
    equal;
    moustache;
    moment;
    const rev = revs[ii];
    const prev = revs[ii+1];

    // changes of interest!!!  TODO @glind make this less gory
    const changes = [];
    if (prev) {
      if (!equal(sampling[ii], sampling[ii+1])) {
        changes.push("sampling-change");
      }

      const s1 = status[ii],
          s0 = status[ii+1];

      const stateFlags = {
        enabled: {
          truefalse: 'disabled',
          falsetrue: "now-enabled"
        },
        approved: {
          falsetrue: "now-approved"
        }
      };
      ['enabled', 'approved'].map(s=>{
        const flag = stateFlags[s][[s0[s],s1[s]].join("")];
        if (flag) changes.push(flag);
      })
    }


    const tpl = `
{{iter}}: ({{{reltime}}})    {{revId}} {{date_created}}
    {{#comment}}{{{comment}}}{{/comment}}
    {{#changes}}changes: {{{changes}}}{{/changes}}
    current: enabled:{{status.enabled}} approved:{{status.approved}}
    sample: {{{sampling}}}`;

    let comment;
    if (status[ii].comment) comment = `"${status[ii].comment}" --${status[ii].approver}`
    const ctx = {
      iter: context.iter,
      date_created: rev.date_created,
      changes: changes.join(" "),
      reltime: moment(rev.date_created).calendar(),
      revId: rev.id.substring(0,6),
      status: status[ii] || {},
      comment: comment,
      sampling: formatSample(sampling[ii]),
    }
    console.log(moustache.render(tpl, ctx))
  }

  console.log("\n## Revision history");

  for (let ii=0; ii < revs.length; ii++) {
    formatRev(ii, {iter: revs.length - ii})
  }
}

const getHistory = exports.getHistory = function (recipeId) {
  const url = `https://normandy.cdn.mozilla.net/api/v2/recipe/${recipeId}/history/`;
  request(url,function(a,b,body) {
    const revs = JSON.parse(body);
    formattedHistory(revs);
  })
}

if (require.main === module) {
  var program = require('commander');
  program
    .version(VERSION)
    .usage('<recipeId>')
    .action(function (recipeId) {
      getHistory(recipeId);
    })
    .parse(process.argv);

  if (!program.args.length) program.help();
}
