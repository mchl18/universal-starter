import { ROUTES } from './static.paths';
import { from, Observable, Observer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { fork } from 'child_process';

const concurrency = +process.argv[2] || 8;

const observableChildProcess = (route) => new Observable((observer: Observer<string>) => {
  const child = fork(`./render.js`, [route]);
  child.on('message', (msg) =>observer.next(msg));
  child.on('close', () => observer.complete())
})

from(ROUTES).pipe(
  mergeMap(route => observableChildProcess(route), concurrency)
).subscribe(
  res => console.log(res),
  err => console.error(err),
  () => console.log('all done')
);
