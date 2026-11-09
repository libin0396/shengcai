/* Shared UI visibility mode. Set tutorialFirst to false to restore all sections. */
(function(root){
  'use strict';
  if(!root)return;
  root.AINPE_SITE_MODE=Object.freeze({tutorialFirst:true});
  if(root.document && root.AINPE_SITE_MODE.tutorialFirst){
    root.document.documentElement.classList.add('tutorial-first');
  }
})(typeof globalThis!=='undefined'?globalThis:typeof window!=='undefined'?window:null);
