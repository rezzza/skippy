'use strict';

var Map = require('immutable').Map;
var List = require('immutable').List;
var Container = require('./Container');
var ObjectHelper = require('./ObjectHelper');
var Parameter = require('./Parameter');
var ParameterCollection = require('./ParameterCollection');
var ServiceArgument = require('./ServiceArgument');
var ServiceArgumentCollection = require('./ServiceArgumentCollection');
var ServiceDefinition = require('./ServiceDefinition');
var ServiceDefinitionCollection = require('./ServiceDefinitionCollection');
var ServiceStorage = require('./ServiceStorage');

/**
 * @param {Array} services
 * @return {ServiceDefinitionCollection}
 */
var buildServiceDefinitionCollection = function buildServiceDefinitionCollection(services) {
    var servicesConfigurationList = new List(services);

    var servicesDefinitionList = servicesConfigurationList.map(function (value) {
        var argumentConfigurationList = new List(value.arguments || []);
        var serviceArgumentList = argumentConfigurationList.map(function (argumentValue) {
            return new ServiceArgument(argumentValue);
        });

        return new ServiceDefinition(
            value.name,
            value.service,
            new ServiceArgumentCollection(serviceArgumentList.toArray()),
            value.singleton || undefined
        );
    });

    return new ServiceDefinitionCollection(servicesDefinitionList.toArray());
};

/**
 * @param {Object} parameters
 * @return {ParameterCollection}
 * @private
 */
var buildParameterCollection = function buildParameterCollection(parameters) {
    var parametersConfigurationMap = new Map(parameters);

    var parameterMap = parametersConfigurationMap.map(function (value, key) {
        return new Parameter(key, value);
    });

    return new ParameterCollection(parameterMap.toArray());
};

var checkCyclicDependencies = function (serviceDefinition, serviceDefinitionCollection, parentDependentServiceNames) {
    parentDependentServiceNames = parentDependentServiceNames || [serviceDefinition.getName()];

    var serviceArguments = new List(serviceDefinition.getArgumentCollection().getServiceArguments());

    serviceArguments.forEach(function (argument) {
        var serviceName = argument.getName();

        if (!serviceDefinitionCollection.hasServiceDefinition(serviceName)) {
            throw new Error('The service "' + serviceDefinition.getName() + '" has dependencies on the unknown service "' + serviceName + '".');
        }

        if (parentDependentServiceNames.indexOf(serviceName) !== -1) {
            parentDependentServiceNames.push(serviceName); // To show the complete dependency graph.
            throw new Error('Cyclic dependencies detected: "' + parentDependentServiceNames.join(' > ') + '".');
        }

        var childDependentServiceNames = ObjectHelper.clone(parentDependentServiceNames);
        childDependentServiceNames.push(serviceName);

        checkCyclicDependencies(serviceDefinitionCollection.getServiceDefinition(serviceName), serviceDefinitionCollection, childDependentServiceNames);
    });
};

var ContainerFactory = {};

/**
 * @param {Array.<{name: String, service: Function, arguments: Array.<String|*>}>} services
 * @param {{String: *}} parameters
 * @return {Container}
 * @public
 */
ContainerFactory.create = function (services, parameters) {
    services = services || [];
    parameters = parameters || {};

    var serviceDefinitionCollection = buildServiceDefinitionCollection(services);
    var parameterCollection = buildParameterCollection(parameters);

    if (process.env.NODE_ENV === 'development') {
        serviceDefinitionCollection.forEach(function (serviceDefinition) {
            checkCyclicDependencies(serviceDefinition, serviceDefinitionCollection);
        });
    }

    return new Container(serviceDefinitionCollection, parameterCollection);
};

module.exports = ContainerFactory;
