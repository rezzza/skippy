'use strict';

/* global describe */
/* global it */

var expect = require('chai').expect;
var Container = require('./../src/Container');
var Parameter = require('./../src/Parameter');
var ParameterCollection = require('./../src/ParameterCollection');
var ServiceArgument = require('./../src/ServiceArgument');
var ServiceArgumentCollection = require('./../src/ServiceArgumentCollection');
var ServiceDefinition = require('./../src/ServiceDefinition');
var ServiceDefinitionCollection = require('./../src/ServiceDefinitionCollection');
var servicesConfigurationValid = require('./fixture/valid/services');
var ServiceA = require('./fixture/valid/ServiceA');
var ServiceC = require('./fixture/valid/ServiceC');

describe('Container', function () {
    it('should return the parameter value', function () {
        var serviceDefinitionCollection = new ServiceDefinitionCollection();
        var parameterCollection = new ParameterCollection([
            new Parameter('foo', 'bar')
        ]);

        var container = new Container(serviceDefinitionCollection, parameterCollection);

        expect(container.getParameter('foo')).to.be.equal('bar');
    });

    it('should return the service instance', function () {
        var serviceDefinitionA = new ServiceDefinition(
            'foo.serviceA',
            ServiceA,
            new ServiceArgumentCollection(),
            true
        );

        var serviceDefinitionCollection = new ServiceDefinitionCollection([serviceDefinitionA]);
        var parameterCollection = new ParameterCollection();

        var container = new Container(serviceDefinitionCollection, parameterCollection);

        expect(container.getService('foo.serviceA')).to.be.an.instanceof(ServiceA);
    });

    it('should return the same service instance for singleton service', function () {
        var serviceDefinitionA = new ServiceDefinition(
            'foo.serviceA',
            ServiceA,
            new ServiceArgumentCollection(),
            true
        );

        var serviceDefinitionCollection = new ServiceDefinitionCollection([serviceDefinitionA]);
        var parameterCollection = new ParameterCollection();

        var container = new Container(serviceDefinitionCollection, parameterCollection);

        var firstCall = container.getService('foo.serviceA');
        var secondCall = container.getService('foo.serviceA');

        expect(firstCall).to.be.equal(secondCall);
    });

    it('should not return the same service instance for non singleton service', function () {
        var serviceDefinitionA = new ServiceDefinition(
            'foo.serviceA',
            ServiceA,
            new ServiceArgumentCollection(),
            false
        );

        var serviceDefinitionCollection = new ServiceDefinitionCollection([serviceDefinitionA]);
        var parameterCollection = new ParameterCollection();

        var container = new Container(serviceDefinitionCollection, parameterCollection);

        var firstCall = container.getService('foo.serviceA');
        var secondCall = container.getService('foo.serviceA');

        expect(firstCall).to.not.be.equal(secondCall);
    });

    it('should throw an exception on undefined parameter', function () {
        var serviceDefinitionCollection = new ServiceDefinitionCollection();

        var parameter = new Parameter('foo', 'bar');
        var parameterCollection = new ParameterCollection([parameter]);

        var container = new Container(serviceDefinitionCollection, parameterCollection);

        expect(function () {
            container.getParameter('i.do.not.exist');
        }).to.throw('Unknown parameter "i.do.not.exist".');
    });

    it('should throw an exception on undefined service', function () {
        var serviceDefinitionCollection = new ServiceDefinitionCollection();
        var parameterCollection = new ParameterCollection();

        var container = new Container(serviceDefinitionCollection, parameterCollection);


        expect(function () {
            container.getService('i.do.not.exist');
        }).to.throw('Unknown service "i.do.not.exist".');
    });

    it('should pass the right argument to the service', function () {
        var serviceDefinitionA = new ServiceDefinition(
            'foo.serviceA',
            ServiceA,
            new ServiceArgumentCollection(),
            true
        );

        var serviceDefinitionC = new ServiceDefinition(
            'foo.serviceC',
            ServiceC,
            new ServiceArgumentCollection([
                new ServiceArgument('%foo%'),
                new ServiceArgument(42),
                new ServiceArgument('@foo.serviceA')
            ]),
            false
        );

        var parameterFoo = new Parameter('foo', 'Pwouet');

        var serviceDefinitionCollection = new ServiceDefinitionCollection([serviceDefinitionA, serviceDefinitionC]);
        var parameterCollection = new ParameterCollection([parameterFoo]);

        var container = new Container(serviceDefinitionCollection, parameterCollection);


        var serviceA = container.getService('foo.serviceA');
        var serviceC = container.getService('foo.serviceC');

        expect(serviceC.foo).to.be.equal('Pwouet');
        expect(serviceC.bar).to.be.equal(42);
        expect(serviceC.serviceA).to.be.equal(serviceA);
    });
});
