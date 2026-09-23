import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

async function theme(saved, systemDark = false, blocked = false) {
  const script=await readFile(new URL('../public/theme.js',import.meta.url),'utf8');
  const dataset={},handlers={},media={matches:systemDark,addEventListener:(_,f)=>{handlers.media=f;}},stored={};
  const buttons=['light','dark'].map(choice=>({dataset:{themeChoice:choice},classList:{toggle(){}},setAttribute(k,v){this[k]=v;}}));
  const context={document:{documentElement:{dataset},querySelectorAll:()=>buttons,addEventListener:(k,f)=>{handlers[k]=f;}},matchMedia:()=>media,localStorage:{getItem(){if(blocked)throw Error();return saved;},setItem(k,v){if(blocked)throw Error();stored[k]=v;}}};
  vm.runInNewContext(script,context);
  const click=choice=>handlers.click({target:{closest:()=>buttons.find(b=>b.dataset.themeChoice===choice)}});
  return {dataset,handlers,media,stored,buttons,click};
}
test('selected orbital design defaults to dark and rejects invalid stored values',async()=>{
  assert.equal((await theme(null)).dataset.theme,'dark');
  assert.equal((await theme('invalid')).dataset.themePreference,'dark');
});
test('day mode persists an explicit choice and updates accessible pressed state',async()=>{
  const t=await theme('dark');t.click('light');
  assert.equal(t.dataset.theme,'light');assert.equal(t.stored['ai-coo-theme'],'light');
  assert.equal(t.buttons[0]['aria-pressed'],'true');assert.equal(t.buttons[1]['aria-pressed'],'false');
});
test('removed system preference falls back to night without following the OS',async()=>{
  const t=await theme('system',false);assert.equal(t.dataset.theme,'dark');
  assert.equal(t.dataset.themePreference,'dark');assert.equal(t.handlers.media,undefined);
  t.click('light');assert.equal(t.dataset.theme,'light');
  assert.equal((await theme(t.stored['ai-coo-theme'],true)).dataset.theme,'light');
});
test('blocked browser storage does not prevent theme switching',async()=>{
  const t=await theme(null,false,true);t.click('light');assert.equal(t.dataset.theme,'light');
});
