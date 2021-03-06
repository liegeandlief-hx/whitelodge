'use-strict'

/* eslint-disable no-undef */

import React from 'react'
import TestComponent from '../TestComponent'
import TestComponentWhichShouldThrow1 from '../TestComponentWhichShouldThrow1'
import TestComponentWhichShouldThrow2 from '../TestComponentWhichShouldThrow2'
import {mount} from 'enzyme'

global.console.log = jest.fn()
global.console.error = jest.fn()
global.console.warn = jest.fn()

describe('Test a component which subscribes to a store.', () => {
  test('Components with invalid store subscriptions should throw errors.', () => {
    expect(() => { mount(<TestComponentWhichShouldThrow1 />) }).toThrow()
    expect(() => { mount(<TestComponentWhichShouldThrow2 />) }).toThrow()
  })

  const component = mount(<TestComponent />)
  const instance = component.instance()

  test('It has the correct initial elements and state.', () => {
    expect(component.find('button')).toHaveLength(1)
    expect(component.find('#counterIs0')).toHaveLength(1)
    expect(component.find('#counterIs1')).toHaveLength(0)
    expect(component.find('#counterIs2')).toHaveLength(0)
    expect(instance.state).toHaveProperty('testStore')
    expect(instance.state.testStore.state.counter).toEqual(0)
  })

  test('It has the correct elements and state after click event which should update state via a store mutation method.', () => {
    component.find('button').simulate('click')
    expect(component.find('button')).toHaveLength(1)
    expect(component.find('#counterIs0')).toHaveLength(0)
    expect(component.find('#counterIs1')).toHaveLength(1)
    expect(component.find('#counterIs2')).toHaveLength(0)
    expect(instance.state).toHaveProperty('testStore')
    expect(instance.state.testStore.state.counter).toEqual(1)
    component.find('button').simulate('click')
    expect(component.find('button')).toHaveLength(1)
    expect(component.find('#counterIs0')).toHaveLength(0)
    expect(component.find('#counterIs1')).toHaveLength(0)
    expect(component.find('#counterIs2')).toHaveLength(1)
    expect(instance.state).toHaveProperty('testStore')
    expect(instance.state.testStore.state.counter).toEqual(2)
    component.find('button').simulate('click')
    expect(component.find('button')).toHaveLength(1)
    expect(component.find('#counterIs0')).toHaveLength(0)
    expect(component.find('#counterIs1')).toHaveLength(0)
    expect(component.find('#counterIs2')).toHaveLength(0)
    expect(instance.state).toHaveProperty('testStore')
    expect(instance.state.testStore.state.counter).toEqual(3)
  })
})
