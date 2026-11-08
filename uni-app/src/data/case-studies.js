import published from './case-studies-published.json';
import {displayCase} from './case-display.mjs';

// Only reviewed, paraphrased public data is bundled; raw posts stay private.
export const caseStudies = published.map(displayCase);
export const caseById = id => caseStudies.find(c => c.id === String(id));
export const caseAsArticle = c => c && ({id:c.id,title:c.title,author:c.author,publishedAt:c.publishedAt,sourceUrl:c.sourceUrl,summary:c.oneLiner,overview:c.oneLiner,topics:c.topics,kind:'案例',isDigested:false});

export {publicNumbers} from './case-display.mjs';
