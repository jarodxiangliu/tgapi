/* @flow */

import { Observable, Subject } from 'rxjs'
import { last } from 'ramda'

import { Client } from './createBotClient'

import type { PartialObserver } from './types'
import type { Update } from './generatedTypes'

type RequestParams = {
  timeout?: number,
  offset?: number,
  allowed_updates?: string[],
  limit?: number,
}

const getRequesrParams =
  (timeout: number, allowedUpdates: void | string[]) =>
    (offset: number): RequestParams => (
      allowedUpdates ?
        { timeout, offset, allowed_updates: allowedUpdates } :
        { timeout, offset }
    )

type Options = {
  allowedUpdates?: string[],
  timeout?: number,
}

export default (
  client: Client,
  observer$: PartialObserver<Update>,
  options: Options = {},
) => {
  const getParams = getRequesrParams(
    Math.max(options.timeout || 1, 1),
    options.allowedUpdates,
  )

  const subject$: Subject<number> = new Subject()

  const result$ =
    subject$
      .startWith(1)
      .map(getParams)
      .mergeMap(client.getUpdates)
      .publish()

  result$.connect()

  const updates$: Observable<Update> =
    result$
      .filter(res => res.ok)
      // $FlowFixMe
      .pluck('result')
      .filter((updates: Update[]) => !!updates.length)
      .mergeMap((updates: Update[]) => Observable.from(updates))

  const offsetSubscription =
    result$.map((res) => {
      if (!res.ok) return 1
      const lastUpdate = last(res.result)
      return lastUpdate ? lastUpdate.update_id + 1 : 1
    }).subscribe(
      offset => subject$.next(offset),
    )

  const updatesSubscription =
    updates$.subscribe(
      update => observer$.next(update),
      err => observer$.error && observer$.error(err),
      () => observer$.complete && observer$.complete(),
    )

  return () => {
    offsetSubscription.unsubscribe()
    updatesSubscription.unsubscribe()
  }
}
