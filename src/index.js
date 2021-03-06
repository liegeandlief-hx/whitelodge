'use strict'

import isObject from 'isobject'
import isFunction from 'is-function'
import clone from 'clone'
import React from 'react'
import root from 'window-or-global'

const rootObjectName = 'whitelodge'
const logPrefix = 'whitelodge | '

const throwError = (message, varToDump = 'varToDumpNotReceived') => {
  if (varToDump !== 'varToDumpNotReceived') console.error(varToDump)
  throw new Error(logPrefix + message)
}

const validateNewState = newState => {
  if (!isObject(newState)) throwError('State must be an object.', newState)
}

export class Store {
  constructor (name, initialState = {}, logStateToConsole = false, numberOfPreviousStatesToKeep = 15) {
    const parsedNumberOfPreviousStatesToKeep = Number(numberOfPreviousStatesToKeep)
    this.validateArguments(name, initialState, logStateToConsole, parsedNumberOfPreviousStatesToKeep)
    this.name = name
    this.state = {}
    this.previousStates = []
    this.subscribers = []
    this.logStateToConsole = logStateToConsole
    this.numberOfPreviousStatesToKeep = parsedNumberOfPreviousStatesToKeep
    this.setStoreState(initialState)
  }

  validateArguments (name, initialState, logStateToConsole, numberOfPreviousStatesToKeep) {
    if (typeof name !== 'string' || !name.length) throwError('Store name should be a non-empty string.', name)
    validateNewState(initialState)
    if (typeof logStateToConsole !== 'boolean') throwError('When indicating whether to log state to console you should pass a boolean value.', logStateToConsole)
    if (isNaN(numberOfPreviousStatesToKeep) || numberOfPreviousStatesToKeep < 1) throwError('When indicating how many previous versions of state to keep you should pass a number > 0.', numberOfPreviousStatesToKeep)
  }

  doLogStateToConsole () {
    if (this.logStateToConsole) console.log(logPrefix + this.name + ' | ', new Date(), this.state)
  }

  addCurrentStateToPreviousStates () {
    this.previousStates.unshift(clone(this.state))
    if (this.previousStates.length > this.numberOfPreviousStatesToKeep) {
      this.previousStates = this.previousStates.slice(0, this.numberOfPreviousStatesToKeep)
    }
  }

  setStoreState (newState) {
    validateNewState(newState)
    this.addCurrentStateToPreviousStates()
    Object.assign(this.state, newState)
    this.subscribers.forEach(subscriber => {
      subscriber.setState({[this.name]: this})
    })
    this.doLogStateToConsole()
  }

  subscribe (newSubscriber) {
    if (!isFunction(newSubscriber.setState)) throwError('Store subscribers must be components with a setState function as a property.', newSubscriber)
    this.subscribers.forEach(subscriber => {
      if (subscriber === newSubscriber) throwError('Component is already subscribed to the store "' + this.name + '".', newSubscriber)
    })
    this.subscribers.push(newSubscriber)
  }

  unsubscribe (unsubscriber) {
    for (let i = 0; i < this.subscribers.length; i++) {
      if (this.subscribers[i] === unsubscriber) {
        this.subscribers.splice(i, 1)
        break
      }
    }
  }
}

export const makeStoresGloballyAvailable = stores => {
  if (!Array.isArray(stores)) throwError('makeStoresGloballyAvailable expects an array of Store instances.', stores)
  stores.forEach(store => {
    if (!(store instanceof Store)) throwError('Invalid Store intance passed to makeStoresGloballyAvailable.', store)
  })
  delete root[rootObjectName]
  const storeNames = []
  root[rootObjectName] = {stores: stores.reduce((storesObject, store) => {
    if (storeNames.indexOf(store.name) > -1) throwError('There is already a store with the name "' + store.name + '". Store names must be unique.', storeNames)
    storeNames.push(store.name)
    storesObject[store.name] = store
    return storesObject
  }, {})}
}

export const AddStoreSubscriptions = (ChildComponent, storeNames) => class extends React.Component {
  constructor () {
    super()
    this.subscribeToStores()
  }

  subscribeToStores () {
    if (!Array.isArray(storeNames)) throwError('The second argument passed to AddStoreSubscriptions should be an array of store names to which you want to subscribe.', storeNames)

    const initialState = {}

    storeNames.forEach(storeName => {
      if (typeof storeName !== 'string') throwError('Each store name passed to AddStoreSubscriptions should be a string.', storeName)
      if (!root[rootObjectName].stores.hasOwnProperty(storeName)) throwError('There is not store called "' + storeName + '".', root[rootObjectName])
      initialState[storeName] = root[rootObjectName].stores[storeName]
      root[rootObjectName].stores[storeName].subscribe(this)
    })

    this.state = initialState
  }

  componentWillUnmount () {
    root[rootObjectName].stores.forEach(store => {
      store.unsubscribe(this)
    })
  }

  render () {
    return <ChildComponent {...this.props} {...this.state} />
  }
}
