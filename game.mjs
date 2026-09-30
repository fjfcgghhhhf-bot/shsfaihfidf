import { randomInt } from 'node:crypto';
export class Game {
  constructor({now=Date.now,random=randomInt,codes=['345231','820935','147983']}={}) { this.now=now; this.random=random; this.codes=codes; this.clients=new Map(); this.phase='waiting'; this.round=0; this.team=[]; this.hits=new Set(); this.deadline=0; this.signal=0; this.message='Собираем экипаж'; this.rewards=new Map(); }
  add(id) { this.clients.set(id,true); this.start(); }
  remove(id) { this.clients.delete(id); if(this.team.includes(id)&&['countdown','active'].includes(this.phase)) this.fail('Игрок отключился. Начинаем заново.'); }
  start() { if(this.phase==='waiting'&&this.clients.size>=4) {this.team=[...this.clients.keys()].slice(0,4); this.round=1; this.prepare();} }
  prepare() {this.phase='countdown';this.hits.clear();this.signal=this.now()+3500;this.deadline=this.signal+5000;this.message='Дождитесь сигнала';}
  fail(message) {this.phase='failed';this.message=message;this.round=0;this.deadline=this.now()+4000;this.hits.clear();}
  press(id,round) {
    this.tick();
    if(!this.team.includes(id)||round!==this.round||this.hits.has(id)) return;
    if(this.phase==='countdown') return this.fail('Слишком рано. Прогресс сброшен.');
    if(this.phase!=='active') return;
    if(!this.hits.size) this.deadline=this.now()+1000;
    this.hits.add(id);
    if(this.hits.size===4) {
      if(this.round<6) {this.round++;this.prepare();}
      else {this.phase='won';this.message='Синхронизация завершена';this.deadline=this.now()+30000;const pool=[...this.team];for(let i=0;i<3;i++)this.rewards.set(pool.splice(this.random(pool.length),1)[0],this.codes[i]);}
    }
  }
  tick() {
    const now=this.now();
    if(this.phase==='countdown'&&now>=this.signal)this.phase='active';
    if(this.phase==='active'&&now>=this.deadline)this.fail('Не успели синхронизироваться. Прогресс сброшен.');
    if(['failed','won'].includes(this.phase)&&now>=this.deadline){if(this.phase==='won')for(const id of this.team){if(this.clients.delete(id))this.clients.set(id,true);}this.phase='waiting';this.round=0;this.team=[];this.rewards.clear();this.message='Собираем экипаж';this.start();}
  }
  view(id) {return {phase:this.phase,round:this.round,online:this.clients.size,crew:Math.min(4,this.clients.size),playing:this.team.includes(id),slot:this.team.indexOf(id)+1,hits:this.hits.size,pressed:this.hits.has(id),signal:this.signal,deadline:this.deadline,now:this.now(),message:this.message,code:this.rewards.get(id)||null};}
}
