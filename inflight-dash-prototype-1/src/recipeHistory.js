
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

const equal = require('deep-equal');
const jexlUtils = require('./jexl-utils');

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

function describeHistory(revs) {
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
  const sampling = revs.map((r)=>jexlUtils.sampling(r.recipe.filter_expression));
  // 2. date
  // 3. status
  const status = revs.map((r)=>describeStatus(r));

  // loop through all the these together to create a FORMATTED HISTORY
  function formatRev (ii, context) {
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
      ['enabled', 'approved'].forEach(s=>{
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
      reltime: rev.date_created,
      revId: rev.id.substring(0,6),
      status: status[ii] || {},
      comment: comment,
      sampling: formatSample(sampling[ii]),
    }
    return ctx;
    //console.log(moustache.render(tpl, ctx))
  }

  //console.log("\n## Revision history");
  const N = revs.length;
  return revs.map((rev, ii) => formatRev(ii, {iter: N - ii}))
}


module.exports = {
  describeHistory
}
