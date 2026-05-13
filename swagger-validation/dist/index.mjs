import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "module";
/******/ var __webpack_modules__ = ({

/***/ 3488:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const ref_js_1 = __importDefault(__nccwpck_require__(43));
const pointer_js_1 = __importDefault(__nccwpck_require__(3487));
const url = __importStar(__nccwpck_require__(4946));
/**
 * Bundles all external JSON references into the main JSON schema, thus resulting in a schema that
 * only has *internal* references, not any *external* references.
 * This method mutates the JSON schema object, adding new references and re-mapping existing ones.
 *
 * @param parser
 * @param options
 */
function bundle(parser, options) {
    // console.log('Bundling $ref pointers in %s', parser.$refs._root$Ref.path);
    // Build an inventory of all $ref pointers in the JSON Schema
    const inventory = [];
    crawl(parser, "schema", parser.$refs._root$Ref.path + "#", "#", 0, inventory, parser.$refs, options);
    // Remap all $ref pointers
    remap(inventory);
}
/**
 * Recursively crawls the given value, and inventories all JSON references.
 *
 * @param parent - The object containing the value to crawl. If the value is not an object or array, it will be ignored.
 * @param key - The property key of `parent` to be crawled
 * @param path - The full path of the property being crawled, possibly with a JSON Pointer in the hash
 * @param pathFromRoot - The path of the property being crawled, from the schema root
 * @param indirections
 * @param inventory - An array of already-inventoried $ref pointers
 * @param $refs
 * @param options
 */
function crawl(parent, key, path, pathFromRoot, indirections, inventory, $refs, options) {
    const obj = key === null ? parent : parent[key];
    const bundleOptions = (options.bundle || {});
    const isExcludedPath = bundleOptions.excludedPathMatcher || (() => false);
    if (obj && typeof obj === "object" && !ArrayBuffer.isView(obj) && !isExcludedPath(pathFromRoot)) {
        if (ref_js_1.default.isAllowed$Ref(obj)) {
            inventory$Ref(parent, key, path, pathFromRoot, indirections, inventory, $refs, options);
        }
        else {
            // Crawl the object in a specific order that's optimized for bundling.
            // This is important because it determines how `pathFromRoot` gets built,
            // which later determines which keys get dereferenced and which ones get remapped
            const keys = Object.keys(obj).sort((a, b) => {
                // Most people will expect references to be bundled into the the "definitions" property,
                // so we always crawl that property first, if it exists.
                if (a === "definitions" || a === "$defs") {
                    return -1;
                }
                else if (b === "definitions" || b === "$defs") {
                    return 1;
                }
                else {
                    // Otherwise, crawl the keys based on their length.
                    // This produces the shortest possible bundled references
                    return a.length - b.length;
                }
            });
            for (const key of keys) {
                const keyPath = pointer_js_1.default.join(path, key);
                const keyPathFromRoot = pointer_js_1.default.join(pathFromRoot, key);
                const value = obj[key];
                if (ref_js_1.default.isAllowed$Ref(value)) {
                    inventory$Ref(obj, key, path, keyPathFromRoot, indirections, inventory, $refs, options);
                }
                else {
                    crawl(obj, key, keyPath, keyPathFromRoot, indirections, inventory, $refs, options);
                }
                // We need to ensure that we have an object to work with here because we may be crawling
                // an `examples` schema and `value` may be nullish.
                if (value && typeof value === "object" && !Array.isArray(value)) {
                    if ("$ref" in value) {
                        bundleOptions?.onBundle?.(value["$ref"], obj[key], obj, key);
                    }
                }
            }
        }
    }
}
/**
 * Inventories the given JSON Reference (i.e. records detailed information about it so we can
 * optimize all $refs in the schema), and then crawls the resolved value.
 *
 * @param $refParent - The object that contains a JSON Reference as one of its keys
 * @param $refKey - The key in `$refParent` that is a JSON Reference
 * @param path - The full path of the JSON Reference at `$refKey`, possibly with a JSON Pointer in the hash
 * @param indirections - unknown
 * @param pathFromRoot - The path of the JSON Reference at `$refKey`, from the schema root
 * @param inventory - An array of already-inventoried $ref pointers
 * @param $refs
 * @param options
 */
function inventory$Ref($refParent, $refKey, path, pathFromRoot, indirections, inventory, $refs, options) {
    const $ref = $refKey === null ? $refParent : $refParent[$refKey];
    const $refPath = url.resolve(path, $ref.$ref);
    const pointer = $refs._resolve($refPath, pathFromRoot, options);
    if (pointer === null) {
        return;
    }
    const parsed = pointer_js_1.default.parse(pathFromRoot);
    const depth = parsed.length;
    const file = url.stripHash(pointer.path);
    const hash = url.getHash(pointer.path);
    const external = file !== $refs._root$Ref.path;
    const extended = ref_js_1.default.isExtended$Ref($ref);
    indirections += pointer.indirections;
    const existingEntry = findInInventory(inventory, $refParent, $refKey);
    if (existingEntry) {
        // This $Ref has already been inventoried, so we don't need to process it again
        if (depth < existingEntry.depth || indirections < existingEntry.indirections) {
            removeFromInventory(inventory, existingEntry);
        }
        else {
            return;
        }
    }
    inventory.push({
        $ref, // The JSON Reference (e.g. {$ref: string})
        parent: $refParent, // The object that contains this $ref pointer
        key: $refKey, // The key in `parent` that is the $ref pointer
        pathFromRoot, // The path to the $ref pointer, from the JSON Schema root
        depth, // How far from the JSON Schema root is this $ref pointer?
        file, // The file that the $ref pointer resolves to
        hash, // The hash within `file` that the $ref pointer resolves to
        value: pointer.value, // The resolved value of the $ref pointer
        circular: pointer.circular, // Is this $ref pointer DIRECTLY circular? (i.e. it references itself)
        extended, // Does this $ref extend its resolved value? (i.e. it has extra properties, in addition to "$ref")
        external, // Does this $ref pointer point to a file other than the main JSON Schema file?
        indirections, // The number of indirect references that were traversed to resolve the value
    });
    // Recursively crawl the resolved value
    if (!existingEntry || external) {
        crawl(pointer.value, null, pointer.path, pathFromRoot, indirections + 1, inventory, $refs, options);
    }
}
/**
 * Re-maps every $ref pointer, so that they're all relative to the root of the JSON Schema.
 * Each referenced value is dereferenced EXACTLY ONCE.  All subsequent references to the same
 * value are re-mapped to point to the first reference.
 *
 * @example: {
 *    first: { $ref: somefile.json#/some/part },
 *    second: { $ref: somefile.json#/another/part },
 *    third: { $ref: somefile.json },
 *    fourth: { $ref: somefile.json#/some/part/sub/part }
 *  }
 *
 * In this example, there are four references to the same file, but since the third reference points
 * to the ENTIRE file, that's the only one we need to dereference.  The other three can just be
 * remapped to point inside the third one.
 *
 * On the other hand, if the third reference DIDN'T exist, then the first and second would both need
 * to be dereferenced, since they point to different parts of the file. The fourth reference does NOT
 * need to be dereferenced, because it can be remapped to point inside the first one.
 *
 * @param inventory
 */
function remap(inventory) {
    // Group & sort all the $ref pointers, so they're in the order that we need to dereference/remap them
    inventory.sort((a, b) => {
        if (a.file !== b.file) {
            // Group all the $refs that point to the same file
            return a.file < b.file ? -1 : +1;
        }
        else if (a.hash !== b.hash) {
            // Group all the $refs that point to the same part of the file
            return a.hash < b.hash ? -1 : +1;
        }
        else if (a.circular !== b.circular) {
            // If the $ref points to itself, then sort it higher than other $refs that point to this $ref
            return a.circular ? -1 : +1;
        }
        else if (a.extended !== b.extended) {
            // If the $ref extends the resolved value, then sort it lower than other $refs that don't extend the value
            return a.extended ? +1 : -1;
        }
        else if (a.indirections !== b.indirections) {
            // Sort direct references higher than indirect references
            return a.indirections - b.indirections;
        }
        else if (a.depth !== b.depth) {
            // Sort $refs by how close they are to the JSON Schema root
            return a.depth - b.depth;
        }
        else {
            // Determine how far each $ref is from the "definitions" property.
            // Most people will expect references to be bundled into the the "definitions" property if possible.
            const aDefinitionsIndex = Math.max(a.pathFromRoot.lastIndexOf("/definitions"), a.pathFromRoot.lastIndexOf("/$defs"));
            const bDefinitionsIndex = Math.max(b.pathFromRoot.lastIndexOf("/definitions"), b.pathFromRoot.lastIndexOf("/$defs"));
            if (aDefinitionsIndex !== bDefinitionsIndex) {
                // Give higher priority to the $ref that's closer to the "definitions" property
                return bDefinitionsIndex - aDefinitionsIndex;
            }
            else {
                // All else is equal, so use the shorter path, which will produce the shortest possible reference
                return a.pathFromRoot.length - b.pathFromRoot.length;
            }
        }
    });
    let file, hash, pathFromRoot;
    for (const entry of inventory) {
        // console.log('Re-mapping $ref pointer "%s" at %s', entry.$ref.$ref, entry.pathFromRoot);
        if (!entry.external) {
            // This $ref already resolves to the main JSON Schema file
            entry.$ref.$ref = entry.hash;
        }
        else if (entry.file === file && entry.hash === hash) {
            // This $ref points to the same value as the prevous $ref, so remap it to the same path
            entry.$ref.$ref = pathFromRoot;
        }
        else if (entry.file === file && entry.hash.indexOf(hash + "/") === 0) {
            // This $ref points to a sub-value of the prevous $ref, so remap it beneath that path
            entry.$ref.$ref = pointer_js_1.default.join(pathFromRoot, pointer_js_1.default.parse(entry.hash.replace(hash, "#")));
        }
        else {
            // We've moved to a new file or new hash
            file = entry.file;
            hash = entry.hash;
            pathFromRoot = entry.pathFromRoot;
            // This is the first $ref to point to this value, so dereference the value.
            // Any other $refs that point to the same value will point to this $ref instead
            entry.$ref = entry.parent[entry.key] = ref_js_1.default.dereference(entry.$ref, entry.value);
            if (entry.circular) {
                // This $ref points to itself
                entry.$ref.$ref = entry.pathFromRoot;
            }
        }
    }
    // we want to ensure that any $refs that point to another $ref are remapped to point to the final value
    // let hadChange = true;
    // while (hadChange) {
    //   hadChange = false;
    //   for (const entry of inventory) {
    //     if (entry.$ref && typeof entry.$ref === "object" && "$ref" in entry.$ref) {
    //       const resolved = inventory.find((e: InventoryEntry) => e.pathFromRoot === entry.$ref.$ref);
    //       if (resolved) {
    //         const resolvedPointsToAnotherRef =
    //           resolved.$ref && typeof resolved.$ref === "object" && "$ref" in resolved.$ref;
    //         if (resolvedPointsToAnotherRef && entry.$ref.$ref !== resolved.$ref.$ref) {
    //           // console.log('Re-mapping $ref pointer "%s" at %s', entry.$ref.$ref, entry.pathFromRoot);
    //           entry.$ref.$ref = resolved.$ref.$ref;
    //           hadChange = true;
    //         }
    //       }
    //     }
    //   }
    // }
}
/**
 * TODO
 */
function findInInventory(inventory, $refParent, $refKey) {
    for (const existingEntry of inventory) {
        if (existingEntry && existingEntry.parent === $refParent && existingEntry.key === $refKey) {
            return existingEntry;
        }
    }
    return undefined;
}
function removeFromInventory(inventory, entry) {
    const index = inventory.indexOf(entry);
    inventory.splice(index, 1);
}
exports["default"] = bundle;


/***/ }),

/***/ 9574:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const ref_js_1 = __importDefault(__nccwpck_require__(43));
const pointer_js_1 = __importDefault(__nccwpck_require__(3487));
const url = __importStar(__nccwpck_require__(4946));
const errors_1 = __nccwpck_require__(5260);
exports["default"] = dereference;
/**
 * Crawls the JSON schema, finds all JSON references, and dereferences them.
 * This method mutates the JSON schema object, replacing JSON references with their resolved value.
 *
 * @param parser
 * @param options
 */
function dereference(parser, options) {
    const start = Date.now();
    // console.log('Dereferencing $ref pointers in %s', parser.$refs._root$Ref.path);
    const dereferenced = crawl(parser.schema, parser.$refs._root$Ref.path, "#", new Set(), new Set(), new Map(), parser.$refs, options, start);
    parser.$refs.circular = dereferenced.circular;
    parser.schema = dereferenced.value;
}
/**
 * Recursively crawls the given value, and dereferences any JSON references.
 *
 * @param obj - The value to crawl. If it's not an object or array, it will be ignored.
 * @param path - The full path of `obj`, possibly with a JSON Pointer in the hash
 * @param pathFromRoot - The path of `obj` from the schema root
 * @param parents - An array of the parent objects that have already been dereferenced
 * @param processedObjects - An array of all the objects that have already been processed
 * @param dereferencedCache - An map of all the dereferenced objects
 * @param $refs
 * @param options
 * @param startTime - The time when the dereferencing started
 * @returns
 */
function crawl(obj, path, pathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime) {
    let dereferenced;
    const result = {
        value: obj,
        circular: false,
    };
    checkDereferenceTimeout(startTime, options);
    const derefOptions = (options.dereference || {});
    const isExcludedPath = derefOptions.excludedPathMatcher || (() => false);
    if (derefOptions?.circular === "ignore" || !processedObjects.has(obj)) {
        if (obj && typeof obj === "object" && !ArrayBuffer.isView(obj) && !isExcludedPath(pathFromRoot)) {
            parents.add(obj);
            processedObjects.add(obj);
            if (ref_js_1.default.isAllowed$Ref(obj, options)) {
                dereferenced = dereference$Ref(obj, path, pathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime);
                result.circular = dereferenced.circular;
                result.value = dereferenced.value;
            }
            else {
                for (const key of Object.keys(obj)) {
                    checkDereferenceTimeout(startTime, options);
                    const keyPath = pointer_js_1.default.join(path, key);
                    const keyPathFromRoot = pointer_js_1.default.join(pathFromRoot, key);
                    if (isExcludedPath(keyPathFromRoot)) {
                        continue;
                    }
                    const value = obj[key];
                    let circular = false;
                    if (ref_js_1.default.isAllowed$Ref(value, options)) {
                        dereferenced = dereference$Ref(value, keyPath, keyPathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime);
                        circular = dereferenced.circular;
                        // Avoid pointless mutations; breaks frozen objects to no profit
                        if (obj[key] !== dereferenced.value) {
                            // If we have properties we want to preserve from our dereferenced schema then we need
                            // to copy them over to our new object.
                            const preserved = new Map();
                            if (derefOptions?.preservedProperties) {
                                if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
                                    derefOptions?.preservedProperties.forEach((prop) => {
                                        if (prop in obj[key]) {
                                            preserved.set(prop, obj[key][prop]);
                                        }
                                    });
                                }
                            }
                            obj[key] = dereferenced.value;
                            // If we have data to preserve and our dereferenced object is still an object then
                            // we need copy back our preserved data into our dereferenced schema.
                            if (derefOptions?.preservedProperties) {
                                if (preserved.size && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
                                    preserved.forEach((value, prop) => {
                                        obj[key][prop] = value;
                                    });
                                }
                            }
                            derefOptions?.onDereference?.(value.$ref, obj[key], obj, key);
                        }
                    }
                    else {
                        if (!parents.has(value)) {
                            dereferenced = crawl(value, keyPath, keyPathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime);
                            circular = dereferenced.circular;
                            // Avoid pointless mutations; breaks frozen objects to no profit
                            if (obj[key] !== dereferenced.value) {
                                obj[key] = dereferenced.value;
                            }
                        }
                        else {
                            circular = foundCircularReference(keyPath, $refs, options);
                        }
                    }
                    // Set the "isCircular" flag if this or any other property is circular
                    result.circular = result.circular || circular;
                }
            }
            parents.delete(obj);
        }
    }
    return result;
}
/**
 * Dereferences the given JSON Reference, and then crawls the resulting value.
 *
 * @param $ref - The JSON Reference to resolve
 * @param path - The full path of `$ref`, possibly with a JSON Pointer in the hash
 * @param pathFromRoot - The path of `$ref` from the schema root
 * @param parents - An array of the parent objects that have already been dereferenced
 * @param processedObjects - An array of all the objects that have already been dereferenced
 * @param dereferencedCache - An map of all the dereferenced objects
 * @param $refs
 * @param options
 * @returns
 */
function dereference$Ref($ref, path, pathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime) {
    const isExternalRef = ref_js_1.default.isExternal$Ref($ref);
    const shouldResolveOnCwd = isExternalRef && options?.dereference?.externalReferenceResolution === "root";
    const $refPath = url.resolve(shouldResolveOnCwd ? url.cwd() : path, $ref.$ref);
    const cache = dereferencedCache.get($refPath);
    if (cache) {
        // If the object we found is circular we can immediately return it because it would have been
        // cached with everything we need already and we don't need to re-process anything inside it.
        //
        // If the cached object however is _not_ circular and there are additional keys alongside our
        // `$ref` pointer here we should merge them back in and return that.
        if (!cache.circular) {
            const refKeys = Object.keys($ref);
            if (refKeys.length > 1) {
                const extraKeys = {};
                for (const key of refKeys) {
                    if (key !== "$ref" && !(key in cache.value)) {
                        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                        extraKeys[key] = $ref[key];
                    }
                }
                return {
                    circular: cache.circular,
                    value: Object.assign({}, cache.value, extraKeys),
                };
            }
            return cache;
        }
        // If both our cached value and our incoming `$ref` are the same then we can return what we
        // got out of the cache, otherwise we should re-process this value. We need to do this because
        // the current dereference caching mechanism doesn't take into account that `$ref` are neither
        // unique or reference the same file.
        //
        // For example if `schema.yaml` references `definitions/child.yaml` and
        // `definitions/parent.yaml` references `child.yaml` then `$ref: 'child.yaml'` may get cached
        // for `definitions/child.yaml`, resulting in `schema.yaml` being having an invalid reference
        // to `child.yaml`.
        //
        // This check is not perfect and the design of the dereference caching mechanism needs a total
        // overhaul.
        if (typeof cache.value === "object" && "$ref" in cache.value && "$ref" in $ref) {
            if (cache.value.$ref === $ref.$ref) {
                return cache;
            }
            else {
                // no-op
            }
        }
        else {
            return cache;
        }
    }
    const pointer = $refs._resolve($refPath, path, options);
    if (pointer === null) {
        return {
            circular: false,
            value: null,
        };
    }
    // Check for circular references
    const directCircular = pointer.circular;
    let circular = directCircular || parents.has(pointer.value);
    if (circular) {
        foundCircularReference(path, $refs, options);
    }
    // Dereference the JSON reference
    let dereferencedValue = ref_js_1.default.dereference($ref, pointer.value);
    // Crawl the dereferenced value (unless it's circular)
    if (!circular) {
        // Determine if the dereferenced value is circular
        const dereferenced = crawl(dereferencedValue, pointer.path, pathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime);
        circular = dereferenced.circular;
        dereferencedValue = dereferenced.value;
    }
    if (circular && !directCircular && options.dereference?.circular === "ignore") {
        // The user has chosen to "ignore" circular references, so don't change the value
        dereferencedValue = $ref;
    }
    if (directCircular) {
        // The pointer is a DIRECT circular reference (i.e. it references itself).
        // So replace the $ref path with the absolute path from the JSON Schema root
        dereferencedValue.$ref = pathFromRoot;
    }
    const dereferencedObject = {
        circular,
        value: dereferencedValue,
    };
    // only cache if no extra properties than $ref
    if (Object.keys($ref).length === 1) {
        dereferencedCache.set($refPath, dereferencedObject);
    }
    return dereferencedObject;
}
/**
 * Check if we've run past our allowed timeout and throw an error if we have.
 *
 * @param startTime - The time when the dereferencing started.
 * @param options
 */
function checkDereferenceTimeout(startTime, options) {
    if (options && options.timeoutMs) {
        if (Date.now() - startTime > options.timeoutMs) {
            throw new errors_1.TimeoutError(options.timeoutMs);
        }
    }
}
/**
 * Called when a circular reference is found.
 * It sets the {@link $Refs#circular} flag, executes the options.dereference.onCircular callback,
 * and throws an error if options.dereference.circular is false.
 *
 * @param keyPath - The JSON Reference path of the circular reference
 * @param $refs
 * @param options
 * @returns - always returns true, to indicate that a circular reference was found
 */
function foundCircularReference(keyPath, $refs, options) {
    $refs.circular = true;
    options?.dereference?.onCircular?.(keyPath);
    if (!options.dereference.circular) {
        const error = new ReferenceError(`Circular $ref pointer found at ${keyPath}`);
        throw error;
    }
    return true;
}


/***/ }),

/***/ 8914:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isUnsafeUrl = exports.$Refs = exports.getJsonSchemaRefParserDefaultOptions = exports.jsonSchemaParserNormalizeArgs = exports.dereferenceInternal = exports.JSONParserErrorGroup = exports.isHandledError = exports.UnmatchedParserError = exports.ParserError = exports.ResolverError = exports.MissingPointerError = exports.InvalidPointerError = exports.JSONParserError = exports.UnmatchedResolverError = exports.dereference = exports.bundle = exports.resolve = exports.parse = exports.$RefParser = void 0;
const refs_js_1 = __importDefault(__nccwpck_require__(414));
exports.$Refs = refs_js_1.default;
const parse_js_1 = __importDefault(__nccwpck_require__(9377));
const normalize_args_js_1 = __importDefault(__nccwpck_require__(2271));
exports.jsonSchemaParserNormalizeArgs = normalize_args_js_1.default;
const resolve_external_js_1 = __importDefault(__nccwpck_require__(9084));
const bundle_js_1 = __importDefault(__nccwpck_require__(3488));
const dereference_js_1 = __importDefault(__nccwpck_require__(9574));
exports.dereferenceInternal = dereference_js_1.default;
const url = __importStar(__nccwpck_require__(4946));
const errors_js_1 = __nccwpck_require__(5260);
Object.defineProperty(exports, "JSONParserError", ({ enumerable: true, get: function () { return errors_js_1.JSONParserError; } }));
Object.defineProperty(exports, "InvalidPointerError", ({ enumerable: true, get: function () { return errors_js_1.InvalidPointerError; } }));
Object.defineProperty(exports, "MissingPointerError", ({ enumerable: true, get: function () { return errors_js_1.MissingPointerError; } }));
Object.defineProperty(exports, "ResolverError", ({ enumerable: true, get: function () { return errors_js_1.ResolverError; } }));
Object.defineProperty(exports, "ParserError", ({ enumerable: true, get: function () { return errors_js_1.ParserError; } }));
Object.defineProperty(exports, "UnmatchedParserError", ({ enumerable: true, get: function () { return errors_js_1.UnmatchedParserError; } }));
Object.defineProperty(exports, "UnmatchedResolverError", ({ enumerable: true, get: function () { return errors_js_1.UnmatchedResolverError; } }));
Object.defineProperty(exports, "isHandledError", ({ enumerable: true, get: function () { return errors_js_1.isHandledError; } }));
Object.defineProperty(exports, "JSONParserErrorGroup", ({ enumerable: true, get: function () { return errors_js_1.JSONParserErrorGroup; } }));
const maybe_js_1 = __importDefault(__nccwpck_require__(5091));
const options_js_1 = __nccwpck_require__(6668);
Object.defineProperty(exports, "getJsonSchemaRefParserDefaultOptions", ({ enumerable: true, get: function () { return options_js_1.getJsonSchemaRefParserDefaultOptions; } }));
const url_js_1 = __nccwpck_require__(4946);
Object.defineProperty(exports, "isUnsafeUrl", ({ enumerable: true, get: function () { return url_js_1.isUnsafeUrl; } }));
/**
 * This class parses a JSON schema, builds a map of its JSON references and their resolved values,
 * and provides methods for traversing, manipulating, and dereferencing those references.
 *
 * @class
 */
class $RefParser {
    /**
     * The parsed (and possibly dereferenced) JSON schema object
     *
     * @type {object}
     * @readonly
     */
    schema = null;
    /**
     * The resolved JSON references
     *
     * @type {$Refs}
     * @readonly
     */
    $refs = new refs_js_1.default();
    async parse() {
        const args = (0, normalize_args_js_1.default)(arguments);
        let promise;
        if (!args.path && !args.schema) {
            const err = new Error(`Expected a file path, URL, or object. Got ${args.path || args.schema}`);
            return (0, maybe_js_1.default)(args.callback, Promise.reject(err));
        }
        // Reset everything
        this.schema = null;
        this.$refs = new refs_js_1.default();
        // If the path is a filesystem path, then convert it to a URL.
        // NOTE: According to the JSON Reference spec, these should already be URLs,
        // but, in practice, many people use local filesystem paths instead.
        // So we're being generous here and doing the conversion automatically.
        // This is not intended to be a 100% bulletproof solution.
        // If it doesn't work for your use-case, then use a URL instead.
        let pathType = "http";
        if (url.isFileSystemPath(args.path)) {
            args.path = url.fromFileSystemPath(args.path);
            pathType = "file";
        }
        else if (!args.path && args.schema && "$id" in args.schema && args.schema.$id) {
            // when schema id has defined an URL should use that hostname to request the references,
            // instead of using the current page URL
            const params = url.parse(args.schema.$id);
            const port = params.protocol === "https:" ? 443 : 80;
            args.path = `${params.protocol}//${params.hostname}:${port}`;
        }
        // Resolve the absolute path of the schema
        args.path = url.resolve(url.cwd(), args.path);
        if (args.schema && typeof args.schema === "object") {
            // A schema object was passed-in.
            // So immediately add a new $Ref with the schema object as its value
            const $ref = this.$refs._add(args.path);
            $ref.value = args.schema;
            $ref.pathType = pathType;
            promise = Promise.resolve(args.schema);
        }
        else {
            // Parse the schema file/url
            promise = (0, parse_js_1.default)(args.path, this.$refs, args.options);
        }
        try {
            const result = await promise;
            if (result !== null && typeof result === "object" && !Buffer.isBuffer(result)) {
                this.schema = result;
                return (0, maybe_js_1.default)(args.callback, Promise.resolve(this.schema));
            }
            else if (args.options.continueOnError) {
                this.schema = null; // it's already set to null at line 79, but let's set it again for the sake of readability
                return (0, maybe_js_1.default)(args.callback, Promise.resolve(this.schema));
            }
            else {
                throw new SyntaxError(`"${this.$refs._root$Ref.path || result}" is not a valid JSON Schema`);
            }
        }
        catch (err) {
            if (!args.options.continueOnError || !(0, errors_js_1.isHandledError)(err)) {
                return (0, maybe_js_1.default)(args.callback, Promise.reject(err));
            }
            if (this.$refs._$refs[url.stripHash(args.path)]) {
                this.$refs._$refs[url.stripHash(args.path)].addError(err);
            }
            return (0, maybe_js_1.default)(args.callback, Promise.resolve(null));
        }
    }
    static parse() {
        const parser = new $RefParser();
        return parser.parse.apply(parser, arguments);
    }
    async resolve() {
        const args = (0, normalize_args_js_1.default)(arguments);
        try {
            await this.parse(args.path, args.schema, args.options);
            await (0, resolve_external_js_1.default)(this, args.options);
            finalize(this);
            return (0, maybe_js_1.default)(args.callback, Promise.resolve(this.$refs));
        }
        catch (err) {
            return (0, maybe_js_1.default)(args.callback, Promise.reject(err));
        }
    }
    static resolve() {
        const instance = new $RefParser();
        return instance.resolve.apply(instance, arguments);
    }
    static bundle() {
        const instance = new $RefParser();
        return instance.bundle.apply(instance, arguments);
    }
    async bundle() {
        const args = (0, normalize_args_js_1.default)(arguments);
        try {
            await this.resolve(args.path, args.schema, args.options);
            (0, bundle_js_1.default)(this, args.options);
            finalize(this);
            return (0, maybe_js_1.default)(args.callback, Promise.resolve(this.schema));
        }
        catch (err) {
            return (0, maybe_js_1.default)(args.callback, Promise.reject(err));
        }
    }
    static dereference() {
        const instance = new $RefParser();
        return instance.dereference.apply(instance, arguments);
    }
    async dereference() {
        const args = (0, normalize_args_js_1.default)(arguments);
        try {
            await this.resolve(args.path, args.schema, args.options);
            (0, dereference_js_1.default)(this, args.options);
            finalize(this);
            return (0, maybe_js_1.default)(args.callback, Promise.resolve(this.schema));
        }
        catch (err) {
            return (0, maybe_js_1.default)(args.callback, Promise.reject(err));
        }
    }
}
exports.$RefParser = $RefParser;
exports["default"] = $RefParser;
function finalize(parser) {
    const errors = errors_js_1.JSONParserErrorGroup.getParserErrors(parser);
    if (errors.length > 0) {
        throw new errors_js_1.JSONParserErrorGroup(parser);
    }
}
exports.parse = $RefParser.parse;
exports.resolve = $RefParser.resolve;
exports.bundle = $RefParser.bundle;
exports.dereference = $RefParser.dereference;


/***/ }),

/***/ 2271:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.normalizeArgs = normalizeArgs;
const options_js_1 = __nccwpck_require__(6668);
/**
 * Normalizes the given arguments, accounting for optional args.
 */
function normalizeArgs(_args) {
    let path;
    let schema;
    let options;
    let callback;
    const args = Array.prototype.slice.call(_args);
    if (typeof args[args.length - 1] === "function") {
        // The last parameter is a callback function
        callback = args.pop();
    }
    if (typeof args[0] === "string") {
        // The first parameter is the path
        path = args[0];
        if (typeof args[2] === "object") {
            // The second parameter is the schema, and the third parameter is the options
            schema = args[1];
            options = args[2];
        }
        else {
            // The second parameter is the options
            schema = undefined;
            options = args[1];
        }
    }
    else {
        // The first parameter is the schema
        path = "";
        schema = args[0];
        options = args[1];
    }
    try {
        options = (0, options_js_1.getNewOptions)(options);
    }
    catch (e) {
        console.error(`JSON Schema Ref Parser: Error normalizing options: ${e}`);
    }
    if (!options.mutateInputSchema && typeof schema === "object") {
        // Make a deep clone of the schema, so that we don't alter the original object
        schema = JSON.parse(JSON.stringify(schema));
    }
    return {
        path,
        schema,
        options,
        callback,
    };
}
exports["default"] = normalizeArgs;


/***/ }),

/***/ 6668:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getNewOptions = exports.getJsonSchemaRefParserDefaultOptions = void 0;
const json_js_1 = __importDefault(__nccwpck_require__(31));
const yaml_js_1 = __importDefault(__nccwpck_require__(5270));
const text_js_1 = __importDefault(__nccwpck_require__(4030));
const binary_js_1 = __importDefault(__nccwpck_require__(2644));
const file_js_1 = __importDefault(__nccwpck_require__(7650));
const http_js_1 = __importDefault(__nccwpck_require__(9596));
const getJsonSchemaRefParserDefaultOptions = () => {
    const defaults = {
        /**
         * Determines how different types of files will be parsed.
         *
         * You can add additional parsers of your own, replace an existing one with
         * your own implementation, or disable any parser by setting it to false.
         */
        parse: {
            json: { ...json_js_1.default },
            yaml: { ...yaml_js_1.default },
            text: { ...text_js_1.default },
            binary: { ...binary_js_1.default },
        },
        /**
         * Determines how JSON References will be resolved.
         *
         * You can add additional resolvers of your own, replace an existing one with
         * your own implementation, or disable any resolver by setting it to false.
         */
        resolve: {
            file: { ...file_js_1.default },
            http: { ...http_js_1.default },
            /**
             * Determines whether external $ref pointers will be resolved.
             * If this option is disabled, then none of above resolvers will be called.
             * Instead, external $ref pointers will simply be ignored.
             *
             * @type {boolean}
             */
            external: true,
        },
        /**
         * By default, JSON Schema $Ref Parser throws the first error it encounters. Setting `continueOnError` to `true`
         * causes it to keep processing as much as possible and then throw a single error that contains all errors
         * that were encountered.
         */
        continueOnError: false,
        /**
         * Determines the types of JSON references that are allowed.
         */
        bundle: {
            /**
             * A function, called for each path, which can return true to stop this path and all
             * subpaths from being processed further. This is useful in schemas where some
             * subpaths contain literal $ref keys that should not be changed.
             *
             * @type {function}
             */
            excludedPathMatcher: () => false,
        },
        /**
         * Determines the types of JSON references that are allowed.
         */
        dereference: {
            /**
             * Dereference circular (recursive) JSON references?
             * If false, then a {@link ReferenceError} will be thrown if a circular reference is found.
             * If "ignore", then circular references will not be dereferenced.
             *
             * @type {boolean|string}
             */
            circular: true,
            /**
             * A function, called for each path, which can return true to stop this path and all
             * subpaths from being dereferenced further. This is useful in schemas where some
             * subpaths contain literal $ref keys that should not be dereferenced.
             *
             * @type {function}
             */
            excludedPathMatcher: () => false,
            referenceResolution: "relative",
        },
        mutateInputSchema: true,
    };
    return defaults;
};
exports.getJsonSchemaRefParserDefaultOptions = getJsonSchemaRefParserDefaultOptions;
const getNewOptions = (options) => {
    const newOptions = (0, exports.getJsonSchemaRefParserDefaultOptions)();
    if (options) {
        merge(newOptions, options);
    }
    return newOptions;
};
exports.getNewOptions = getNewOptions;
/**
 * Merges the properties of the source object into the target object.
 *
 * @param target - The object that we're populating
 * @param source - The options that are being merged
 * @returns
 */
function merge(target, source) {
    if (isMergeable(source)) {
        // prevent prototype pollution
        const keys = Object.keys(source).filter((key) => !["__proto__", "constructor", "prototype"].includes(key));
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const sourceSetting = source[key];
            const targetSetting = target[key];
            if (isMergeable(sourceSetting)) {
                // It's a nested object, so merge it recursively
                target[key] = merge(targetSetting || {}, sourceSetting);
            }
            else if (sourceSetting !== undefined) {
                // It's a scalar value, function, or array. No merging necessary. Just overwrite the target value.
                target[key] = sourceSetting;
            }
        }
    }
    return target;
}
/**
 * Determines whether the given value can be merged,
 * or if it is a scalar value that should just override the target value.
 *
 * @param val
 * @returns
 */
function isMergeable(val) {
    return val && typeof val === "object" && !Array.isArray(val) && !(val instanceof RegExp) && !(val instanceof Date);
}


/***/ }),

/***/ 9377:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
const url = __importStar(__nccwpck_require__(4946));
const plugins = __importStar(__nccwpck_require__(2247));
const errors_js_1 = __nccwpck_require__(5260);
/**
 * Reads and parses the specified file path or URL.
 */
async function parse(path, $refs, options) {
    // Remove the URL fragment, if any
    const hashIndex = path.indexOf("#");
    let hash = "";
    if (hashIndex >= 0) {
        hash = path.substring(hashIndex);
        // Remove the URL fragment, if any
        path = path.substring(0, hashIndex);
    }
    // Add a new $Ref for this file, even though we don't have the value yet.
    // This ensures that we don't simultaneously read & parse the same file multiple times
    const $ref = $refs._add(path);
    // This "file object" will be passed to all resolvers and parsers.
    const file = {
        url: path,
        hash,
        extension: url.getExtension(path),
    };
    // Read the file and then parse the data
    try {
        const resolver = await readFile(file, options, $refs);
        $ref.pathType = resolver.plugin.name;
        file.data = resolver.result;
        const parser = await parseFile(file, options, $refs);
        $ref.value = parser.result;
        return parser.result;
    }
    catch (err) {
        if ((0, errors_js_1.isHandledError)(err)) {
            $ref.value = err;
        }
        throw err;
    }
}
/**
 * Reads the given file, using the configured resolver plugins
 *
 * @param file           - An object containing information about the referenced file
 * @param file.url       - The full URL of the referenced file
 * @param file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
 * @param options
 * @param $refs
 * @returns
 * The promise resolves with the raw file contents and the resolver that was used.
 */
async function readFile(file, options, $refs) {
    // console.log('Reading %s', file.url);
    // Find the resolvers that can read this file
    let resolvers = plugins.all(options.resolve);
    resolvers = plugins.filter(resolvers, "canRead", file);
    // Run the resolvers, in order, until one of them succeeds
    plugins.sort(resolvers);
    try {
        const data = await plugins.run(resolvers, "read", file, $refs);
        return data;
    }
    catch (err) {
        if (!err && options.continueOnError) {
            // No resolver could be matched
            throw new errors_js_1.UnmatchedResolverError(file.url);
        }
        else if (!err || !("error" in err)) {
            // Throw a generic, friendly error.
            throw new SyntaxError(`Unable to resolve $ref pointer "${file.url}"`);
        }
        // Throw the original error, if it's one of our own (user-friendly) errors.
        else if (err.error instanceof errors_js_1.ResolverError) {
            throw err.error;
        }
        else {
            throw new errors_js_1.ResolverError(err, file.url);
        }
    }
}
/**
 * Parses the given file's contents, using the configured parser plugins.
 *
 * @param file           - An object containing information about the referenced file
 * @param file.url       - The full URL of the referenced file
 * @param file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
 * @param file.data      - The file contents. This will be whatever data type was returned by the resolver
 * @param options
 * @param $refs
 *
 * @returns
 * The promise resolves with the parsed file contents and the parser that was used.
 */
async function parseFile(file, options, $refs) {
    // Find the parsers that can read this file type.
    // If none of the parsers are an exact match for this file, then we'll try ALL of them.
    // This handles situations where the file IS a supported type, just with an unknown extension.
    const allParsers = plugins.all(options.parse);
    const filteredParsers = plugins.filter(allParsers, "canParse", file);
    const parsers = filteredParsers.length > 0 ? filteredParsers : allParsers;
    // Run the parsers, in order, until one of them succeeds
    plugins.sort(parsers);
    try {
        const parser = await plugins.run(parsers, "parse", file, $refs);
        if (!parser.plugin.allowEmpty && isEmpty(parser.result)) {
            throw new SyntaxError(`Error parsing "${file.url}" as ${parser.plugin.name}. \nParsed value is empty`);
        }
        else {
            return parser;
        }
    }
    catch (err) {
        if (!err && options.continueOnError) {
            // No resolver could be matched
            throw new errors_js_1.UnmatchedParserError(file.url);
        }
        else if (err && err.message && err.message.startsWith("Error parsing")) {
            throw err;
        }
        else if (!err || !("error" in err)) {
            throw new SyntaxError(`Unable to parse ${file.url}`);
        }
        else if (err.error instanceof errors_js_1.ParserError) {
            throw err.error;
        }
        else {
            throw new errors_js_1.ParserError(err.error.message, file.url);
        }
    }
}
/**
 * Determines whether the parsed value is "empty".
 *
 * @param value
 * @returns
 */
function isEmpty(value) {
    return (value === undefined ||
        (typeof value === "object" && Object.keys(value).length === 0) ||
        (typeof value === "string" && value.trim().length === 0) ||
        (Buffer.isBuffer(value) && value.length === 0));
}
exports["default"] = parse;


/***/ }),

/***/ 2644:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const BINARY_REGEXP = /\.(jpeg|jpg|gif|png|bmp|ico)$/i;
exports["default"] = {
    /**
     * The order that this parser will run, in relation to other parsers.
     */
    order: 400,
    /**
     * Whether to allow "empty" files (zero bytes).
     */
    allowEmpty: true,
    /**
     * Determines whether this parser can parse a given file reference.
     * Parsers that return true will be tried, in order, until one successfully parses the file.
     * Parsers that return false will be skipped, UNLESS all parsers returned false, in which case
     * every parser will be tried.
     */
    canParse(file) {
        // Use this parser if the file is a Buffer, and has a known binary extension
        return Buffer.isBuffer(file.data) && BINARY_REGEXP.test(file.url);
    },
    /**
     * Parses the given data as a Buffer (byte array).
     */
    parse(file) {
        if (Buffer.isBuffer(file.data)) {
            return file.data;
        }
        else {
            // This will reject if data is anything other than a string or typed array
            return Buffer.from(file.data);
        }
    },
};


/***/ }),

/***/ 31:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const errors_js_1 = __nccwpck_require__(5260);
exports["default"] = {
    /**
     * The order that this parser will run, in relation to other parsers.
     */
    order: 100,
    /**
     * Whether to allow "empty" files. This includes zero-byte files, as well as empty JSON objects.
     */
    allowEmpty: true,
    /**
     * Determines whether this parser can parse a given file reference.
     * Parsers that match will be tried, in order, until one successfully parses the file.
     * Parsers that don't match will be skipped, UNLESS none of the parsers match, in which case
     * every parser will be tried.
     */
    canParse: ".json",
    /**
     * Allow JSON files with byte order marks (BOM)
     */
    allowBOM: true,
    /**
     * Parses the given file as JSON
     */
    async parse(file) {
        let data = file.data;
        if (Buffer.isBuffer(data)) {
            data = data.toString();
        }
        if (typeof data === "string") {
            if (data.trim().length === 0) {
                return; // This mirrors the YAML behavior
            }
            else {
                try {
                    return JSON.parse(data);
                }
                catch (e) {
                    if (this.allowBOM) {
                        try {
                            // find the first curly brace
                            const firstCurlyBrace = data.indexOf("{");
                            // remove any characters before the first curly brace
                            data = data.slice(firstCurlyBrace);
                            return JSON.parse(data);
                        }
                        catch (e) {
                            throw new errors_js_1.ParserError(e.message, file.url);
                        }
                    }
                    throw new errors_js_1.ParserError(e.message, file.url);
                }
            }
        }
        else {
            // data is already a JavaScript value (object, array, number, null, NaN, etc.)
            return data;
        }
    },
};


/***/ }),

/***/ 4030:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const errors_js_1 = __nccwpck_require__(5260);
const TEXT_REGEXP = /\.(txt|htm|html|md|xml|js|min|map|css|scss|less|svg)$/i;
exports["default"] = {
    /**
     * The order that this parser will run, in relation to other parsers.
     */
    order: 300,
    /**
     * Whether to allow "empty" files (zero bytes).
     */
    allowEmpty: true,
    /**
     * The encoding that the text is expected to be in.
     */
    encoding: "utf8",
    /**
     * Determines whether this parser can parse a given file reference.
     * Parsers that return true will be tried, in order, until one successfully parses the file.
     * Parsers that return false will be skipped, UNLESS all parsers returned false, in which case
     * every parser will be tried.
     */
    canParse(file) {
        // Use this parser if the file is a string or Buffer, and has a known text-based extension
        return (typeof file.data === "string" || Buffer.isBuffer(file.data)) && TEXT_REGEXP.test(file.url);
    },
    /**
     * Parses the given file as text
     */
    parse(file) {
        if (typeof file.data === "string") {
            return file.data;
        }
        else if (Buffer.isBuffer(file.data)) {
            return file.data.toString(this.encoding);
        }
        else {
            throw new errors_js_1.ParserError("data is not text", file.url);
        }
    },
};


/***/ }),

/***/ 5270:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const errors_js_1 = __nccwpck_require__(5260);
const js_yaml_1 = __importDefault(__nccwpck_require__(4281));
const js_yaml_2 = __nccwpck_require__(4281);
exports["default"] = {
    /**
     * The order that this parser will run, in relation to other parsers.
     */
    order: 200,
    /**
     * Whether to allow "empty" files. This includes zero-byte files, as well as empty JSON objects.
     */
    allowEmpty: true,
    /**
     * Determines whether this parser can parse a given file reference.
     * Parsers that match will be tried, in order, until one successfully parses the file.
     * Parsers that don't match will be skipped, UNLESS none of the parsers match, in which case
     * every parser will be tried.
     */
    canParse: [".yaml", ".yml", ".json"], // JSON is valid YAML
    /**
     * Parses the given file as YAML
     *
     * @param file           - An object containing information about the referenced file
     * @param file.url       - The full URL of the referenced file
     * @param file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
     * @param file.data      - The file contents. This will be whatever data type was returned by the resolver
     * @returns
     */
    async parse(file) {
        let data = file.data;
        if (Buffer.isBuffer(data)) {
            data = data.toString();
        }
        if (typeof data === "string") {
            try {
                return js_yaml_1.default.load(data, { schema: js_yaml_2.JSON_SCHEMA });
            }
            catch (e) {
                try {
                    // fallback to non JSON_SCHEMA
                    return js_yaml_1.default.load(data);
                }
                catch (e) {
                    throw new errors_js_1.ParserError(e?.message || "Parser Error", file.url);
                }
            }
        }
        else {
            // data is already a JavaScript value (object, array, number, null, NaN, etc.)
            return data;
        }
    },
};


/***/ }),

/***/ 3487:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.nullSymbol = void 0;
const ref_js_1 = __importDefault(__nccwpck_require__(43));
const url = __importStar(__nccwpck_require__(4946));
const errors_js_1 = __nccwpck_require__(5260);
exports.nullSymbol = Symbol("null");
const slashes = /\//g;
const tildes = /~/g;
const escapedSlash = /~1/g;
const escapedTilde = /~0/g;
const safeDecodeURIComponent = (encodedURIComponent) => {
    try {
        return decodeURIComponent(encodedURIComponent);
    }
    catch {
        return encodedURIComponent;
    }
};
/**
 * This class represents a single JSON pointer and its resolved value.
 *
 * @param $ref
 * @param path
 * @param [friendlyPath] - The original user-specified path (used for error messages)
 * @class
 */
class Pointer {
    /**
     * The {@link $Ref} object that contains this {@link Pointer} object.
     */
    $ref;
    /**
     * The file path or URL, containing the JSON pointer in the hash.
     * This path is relative to the path of the main JSON schema file.
     */
    path;
    /**
     * The original path or URL, used for error messages.
     */
    originalPath;
    /**
     * The value of the JSON pointer.
     * Can be any JSON type, not just objects. Unknown file types are represented as Buffers (byte arrays).
     */
    value;
    /**
     * Indicates whether the pointer references itself.
     */
    circular;
    /**
     * The number of indirect references that were traversed to resolve the value.
     * Resolving a single pointer may require resolving multiple $Refs.
     */
    indirections;
    constructor($ref, path, friendlyPath) {
        this.$ref = $ref;
        this.path = path;
        this.originalPath = friendlyPath || path;
        this.value = undefined;
        this.circular = false;
        this.indirections = 0;
    }
    /**
     * Resolves the value of a nested property within the given object.
     *
     * @param obj - The object that will be crawled
     * @param options
     * @param pathFromRoot - the path of place that initiated resolving
     *
     * @returns
     * Returns a JSON pointer whose {@link Pointer#value} is the resolved value.
     * If resolving this value required resolving other JSON references, then
     * the {@link Pointer#$ref} and {@link Pointer#path} will reflect the resolution path
     * of the resolved value.
     */
    resolve(obj, options, pathFromRoot) {
        const tokens = Pointer.parse(this.path, this.originalPath);
        const found = [];
        // Crawl the object, one token at a time
        this.value = unwrapOrThrow(obj);
        for (let i = 0; i < tokens.length; i++) {
            if (resolveIf$Ref(this, options, pathFromRoot)) {
                // The $ref path has changed, so append the remaining tokens to the path
                this.path = Pointer.join(this.path, tokens.slice(i));
            }
            const token = tokens[i];
            if (this.value[token] === undefined || (this.value[token] === null && i === tokens.length - 1)) {
                // one final case is if the entry itself includes slashes, and was parsed out as a token - we can join the remaining tokens and try again
                let didFindSubstringSlashMatch = false;
                for (let j = tokens.length - 1; j > i; j--) {
                    const joinedToken = tokens.slice(i, j + 1).join("/");
                    if (this.value[joinedToken] !== undefined) {
                        this.value = this.value[joinedToken];
                        i = j;
                        didFindSubstringSlashMatch = true;
                        break;
                    }
                }
                if (didFindSubstringSlashMatch) {
                    continue;
                }
                // If the token we're looking for ended up not containing any slashes but is
                // actually instead pointing to an existing `null` value then we should use that
                // `null` value.
                if (token in this.value && this.value[token] === null) {
                    // We use a `null` symbol for internal tracking to differntiate between a general `null`
                    // value and our expected `null` value.
                    this.value = exports.nullSymbol;
                    continue;
                }
                this.value = null;
                const path = this.$ref.path || "";
                const targetRef = this.path.replace(path, "");
                const targetFound = Pointer.join("", found);
                const parentPath = pathFromRoot?.replace(path, "");
                throw new errors_js_1.MissingPointerError(token, decodeURI(this.originalPath), targetRef, targetFound, parentPath);
            }
            else {
                this.value = this.value[token];
            }
            found.push(token);
        }
        // Resolve the final value
        if (!this.value || (this.value.$ref && url.resolve(this.path, this.value.$ref) !== pathFromRoot)) {
            resolveIf$Ref(this, options, pathFromRoot);
        }
        return this;
    }
    /**
     * Sets the value of a nested property within the given object.
     *
     * @param obj - The object that will be crawled
     * @param value - the value to assign
     * @param options
     *
     * @returns
     * Returns the modified object, or an entirely new object if the entire object is overwritten.
     */
    set(obj, value, options) {
        const tokens = Pointer.parse(this.path);
        let token;
        if (tokens.length === 0) {
            // There are no tokens, replace the entire object with the new value
            this.value = value;
            return value;
        }
        // Crawl the object, one token at a time
        this.value = unwrapOrThrow(obj);
        for (let i = 0; i < tokens.length - 1; i++) {
            resolveIf$Ref(this, options);
            token = tokens[i];
            if (this.value && this.value[token] !== undefined) {
                // The token exists
                this.value = this.value[token];
            }
            else {
                // The token doesn't exist, so create it
                this.value = setValue(this, token, {});
            }
        }
        // Set the value of the final token
        resolveIf$Ref(this, options);
        token = tokens[tokens.length - 1];
        setValue(this, token, value);
        // Return the updated object
        return obj;
    }
    /**
     * Parses a JSON pointer (or a path containing a JSON pointer in the hash)
     * and returns an array of the pointer's tokens.
     * (e.g. "schema.json#/definitions/person/name" => ["definitions", "person", "name"])
     *
     * The pointer is parsed according to RFC 6901
     * {@link https://tools.ietf.org/html/rfc6901#section-3}
     *
     * @param path
     * @param [originalPath]
     * @returns
     */
    static parse(path, originalPath) {
        // Get the JSON pointer from the path's hash
        const pointer = url.getHash(path).substring(1);
        // If there's no pointer, then there are no tokens,
        // so return an empty array
        if (!pointer) {
            return [];
        }
        // Split into an array
        const split = pointer.split("/");
        // Decode each part, according to RFC 6901
        for (let i = 0; i < split.length; i++) {
            split[i] = safeDecodeURIComponent(split[i].replace(escapedSlash, "/").replace(escapedTilde, "~"));
        }
        if (split[0] !== "") {
            throw new errors_js_1.InvalidPointerError(pointer, originalPath === undefined ? path : originalPath);
        }
        return split.slice(1);
    }
    /**
     * Creates a JSON pointer path, by joining one or more tokens to a base path.
     *
     * @param base - The base path (e.g. "schema.json#/definitions/person")
     * @param tokens - The token(s) to append (e.g. ["name", "first"])
     * @returns
     */
    static join(base, tokens) {
        // Ensure that the base path contains a hash
        if (base.indexOf("#") === -1) {
            base += "#";
        }
        // Append each token to the base path
        tokens = Array.isArray(tokens) ? tokens : [tokens];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            // Encode the token, according to RFC 6901
            base += "/" + encodeURIComponent(token.replace(tildes, "~0").replace(slashes, "~1"));
        }
        return base;
    }
}
/**
 * If the given pointer's {@link Pointer#value} is a JSON reference,
 * then the reference is resolved and {@link Pointer#value} is replaced with the resolved value.
 * In addition, {@link Pointer#path} and {@link Pointer#$ref} are updated to reflect the
 * resolution path of the new value.
 *
 * @param pointer
 * @param options
 * @param [pathFromRoot] - the path of place that initiated resolving
 * @returns - Returns `true` if the resolution path changed
 */
function resolveIf$Ref(pointer, options, pathFromRoot) {
    // Is the value a JSON reference? (and allowed?)
    if (ref_js_1.default.isAllowed$Ref(pointer.value, options)) {
        const $refPath = url.resolve(pointer.path, pointer.value.$ref);
        if ($refPath === pointer.path && !isRootPath(pathFromRoot)) {
            // The value is a reference to itself, so there's nothing to do.
            pointer.circular = true;
        }
        else {
            const resolved = pointer.$ref.$refs._resolve($refPath, pointer.path, options);
            if (resolved === null) {
                return false;
            }
            pointer.indirections += resolved.indirections + 1;
            if (ref_js_1.default.isExtended$Ref(pointer.value)) {
                // This JSON reference "extends" the resolved value, rather than simply pointing to it.
                // So the resolved path does NOT change.  Just the value does.
                pointer.value = ref_js_1.default.dereference(pointer.value, resolved.value);
                return false;
            }
            else {
                // Resolve the reference
                pointer.$ref = resolved.$ref;
                pointer.path = resolved.path;
                pointer.value = resolved.value;
            }
            return true;
        }
    }
    return undefined;
}
exports["default"] = Pointer;
/**
 * Sets the specified token value of the {@link Pointer#value}.
 *
 * The token is evaluated according to RFC 6901.
 * {@link https://tools.ietf.org/html/rfc6901#section-4}
 *
 * @param pointer - The JSON Pointer whose value will be modified
 * @param token - A JSON Pointer token that indicates how to modify `obj`
 * @param value - The value to assign
 * @returns - Returns the assigned value
 */
function setValue(pointer, token, value) {
    if (pointer.value && typeof pointer.value === "object") {
        if (token === "-" && Array.isArray(pointer.value)) {
            pointer.value.push(value);
        }
        else {
            pointer.value[token] = value;
        }
    }
    else {
        throw new errors_js_1.JSONParserError(`Error assigning $ref pointer "${pointer.path}". \nCannot set "${token}" of a non-object.`);
    }
    return value;
}
function unwrapOrThrow(value) {
    if ((0, errors_js_1.isHandledError)(value)) {
        throw value;
    }
    return value;
}
function isRootPath(pathFromRoot) {
    return typeof pathFromRoot == "string" && Pointer.parse(pathFromRoot).length == 0;
}


/***/ }),

/***/ 43:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
const pointer_js_1 = __importStar(__nccwpck_require__(3487));
const errors_js_1 = __nccwpck_require__(5260);
const url_js_1 = __nccwpck_require__(4946);
/**
 * This class represents a single JSON reference and its resolved value.
 *
 * @class
 */
class $Ref {
    /**
     * The file path or URL of the referenced file.
     * This path is relative to the path of the main JSON schema file.
     *
     * This path does NOT contain document fragments (JSON pointers). It always references an ENTIRE file.
     * Use methods such as {@link $Ref#get}, {@link $Ref#resolve}, and {@link $Ref#exists} to get
     * specific JSON pointers within the file.
     *
     * @type {string}
     */
    path;
    /**
     * The resolved value of the JSON reference.
     * Can be any JSON type, not just objects. Unknown file types are represented as Buffers (byte arrays).
     *
     * @type {?*}
     */
    value;
    /**
     * The {@link $Refs} object that contains this {@link $Ref} object.
     *
     * @type {$Refs}
     */
    $refs;
    /**
     * Indicates the type of {@link $Ref#path} (e.g. "file", "http", etc.)
     */
    pathType;
    /**
     * List of all errors. Undefined if no errors.
     */
    errors = [];
    constructor($refs) {
        this.$refs = $refs;
    }
    /**
     * Pushes an error to errors array.
     *
     * @param err - The error to be pushed
     * @returns
     */
    addError(err) {
        if (this.errors === undefined) {
            this.errors = [];
        }
        const existingErrors = this.errors.map(({ footprint }) => footprint);
        // the path has been almost certainly set at this point,
        // but just in case something went wrong, normalizeError injects path if necessary
        // moreover, certain errors might point at the same spot, so filter them out to reduce noise
        if ("errors" in err && Array.isArray(err.errors)) {
            this.errors.push(...err.errors.map(errors_js_1.normalizeError).filter(({ footprint }) => !existingErrors.includes(footprint)));
        }
        else if (!("footprint" in err) || !existingErrors.includes(err.footprint)) {
            this.errors.push((0, errors_js_1.normalizeError)(err));
        }
    }
    /**
     * Determines whether the given JSON reference exists within this {@link $Ref#value}.
     *
     * @param path - The full path being resolved, optionally with a JSON pointer in the hash
     * @param options
     * @returns
     */
    exists(path, options) {
        try {
            this.resolve(path, options);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Resolves the given JSON reference within this {@link $Ref#value} and returns the resolved value.
     *
     * @param path - The full path being resolved, optionally with a JSON pointer in the hash
     * @param options
     * @returns - Returns the resolved value
     */
    get(path, options) {
        return this.resolve(path, options)?.value;
    }
    /**
     * Resolves the given JSON reference within this {@link $Ref#value}.
     *
     * @param path - The full path being resolved, optionally with a JSON pointer in the hash
     * @param options
     * @param friendlyPath - The original user-specified path (used for error messages)
     * @param pathFromRoot - The path of `obj` from the schema root
     * @returns
     */
    resolve(path, options, friendlyPath, pathFromRoot) {
        const pointer = new pointer_js_1.default(this, path, friendlyPath);
        try {
            const resolved = pointer.resolve(this.value, options, pathFromRoot);
            if (resolved.value === pointer_js_1.nullSymbol) {
                resolved.value = null;
            }
            return resolved;
        }
        catch (err) {
            if (!options || !options.continueOnError || !(0, errors_js_1.isHandledError)(err)) {
                throw err;
            }
            if (err.path === null) {
                err.path = (0, url_js_1.safePointerToPath)((0, url_js_1.getHash)(pathFromRoot));
            }
            if (err instanceof errors_js_1.InvalidPointerError) {
                err.source = decodeURI((0, url_js_1.stripHash)(pathFromRoot));
            }
            this.addError(err);
            return null;
        }
    }
    /**
     * Sets the value of a nested property within this {@link $Ref#value}.
     * If the property, or any of its parents don't exist, they will be created.
     *
     * @param path - The full path of the property to set, optionally with a JSON pointer in the hash
     * @param value - The value to assign
     */
    set(path, value) {
        const pointer = new pointer_js_1.default(this, path);
        this.value = pointer.set(this.value, value);
        if (this.value === pointer_js_1.nullSymbol) {
            this.value = null;
        }
    }
    /**
     * Determines whether the given value is a JSON reference.
     *
     * @param value - The value to inspect
     * @returns
     */
    static is$Ref(value) {
        return (Boolean(value) &&
            typeof value === "object" &&
            value !== null &&
            "$ref" in value &&
            typeof value.$ref === "string" &&
            value.$ref.length > 0);
    }
    /**
     * Determines whether the given value is an external JSON reference.
     *
     * @param value - The value to inspect
     * @returns
     */
    static isExternal$Ref(value) {
        return $Ref.is$Ref(value) && value.$ref[0] !== "#";
    }
    /**
     * Determines whether the given value is a JSON reference, and whether it is allowed by the options.
     * For example, if it references an external file, then options.resolve.external must be true.
     *
     * @param value - The value to inspect
     * @param options
     * @returns
     */
    static isAllowed$Ref(value, options) {
        if (this.is$Ref(value)) {
            if (value.$ref.substring(0, 2) === "#/" || value.$ref === "#") {
                // It's a JSON Pointer reference, which is always allowed
                return true;
            }
            else if (value.$ref[0] !== "#" && (!options || options.resolve?.external)) {
                // It's an external reference, which is allowed by the options
                return true;
            }
        }
        return undefined;
    }
    /**
     * Determines whether the given value is a JSON reference that "extends" its resolved value.
     * That is, it has extra properties (in addition to "$ref"), so rather than simply pointing to
     * an existing value, this $ref actually creates a NEW value that is a shallow copy of the resolved
     * value, plus the extra properties.
     *
     * @example: {
       person: {
         properties: {
           firstName: { type: string }
           lastName: { type: string }
         }
       }
       employee: {
         properties: {
           $ref: #/person/properties
           salary: { type: number }
         }
       }
     }
     *  In this example, "employee" is an extended $ref, since it extends "person" with an additional
     *  property (salary).  The result is a NEW value that looks like this:
     *
     *  {
     *    properties: {
     *      firstName: { type: string }
     *      lastName: { type: string }
     *      salary: { type: number }
     *    }
     *  }
     *
     * @param value - The value to inspect
     * @returns
     */
    static isExtended$Ref(value) {
        return $Ref.is$Ref(value) && Object.keys(value).length > 1;
    }
    /**
     * Returns the resolved value of a JSON Reference.
     * If necessary, the resolved value is merged with the JSON Reference to create a new object
     *
     * @example: {
    person: {
      properties: {
        firstName: { type: string }
        lastName: { type: string }
      }
    }
    employee: {
      properties: {
        $ref: #/person/properties
        salary: { type: number }
      }
    }
    } When "person" and "employee" are merged, you end up with the following object:
     *
     *  {
     *    properties: {
     *      firstName: { type: string }
     *      lastName: { type: string }
     *      salary: { type: number }
     *    }
     *  }
     *
     * @param $ref - The JSON reference object (the one with the "$ref" property)
     * @param resolvedValue - The resolved value, which can be any type
     * @returns - Returns the dereferenced value
     */
    static dereference($ref, resolvedValue) {
        if (resolvedValue && typeof resolvedValue === "object" && $Ref.isExtended$Ref($ref)) {
            const merged = {};
            for (const key of Object.keys($ref)) {
                if (key !== "$ref") {
                    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                    merged[key] = $ref[key];
                }
            }
            for (const key of Object.keys(resolvedValue)) {
                if (!(key in merged)) {
                    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                    merged[key] = resolvedValue[key];
                }
            }
            return merged;
        }
        else {
            // Completely replace the original reference with the resolved value
            return resolvedValue;
        }
    }
}
exports["default"] = $Ref;


/***/ }),

/***/ 414:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const ref_js_1 = __importDefault(__nccwpck_require__(43));
const url = __importStar(__nccwpck_require__(4946));
const convert_path_to_posix_1 = __importDefault(__nccwpck_require__(7348));
/**
 * When you call the resolve method, the value that gets passed to the callback function (or Promise) is a $Refs object. This same object is accessible via the parser.$refs property of $RefParser objects.
 *
 * This object is a map of JSON References and their resolved values. It also has several convenient helper methods that make it easy for you to navigate and manipulate the JSON References.
 *
 * See https://apidevtools.com/json-schema-ref-parser/docs/refs.html
 */
class $Refs {
    /**
     * This property is true if the schema contains any circular references. You may want to check this property before serializing the dereferenced schema as JSON, since JSON.stringify() does not support circular references by default.
     *
     * See https://apidevtools.com/json-schema-ref-parser/docs/refs.html#circular
     */
    circular;
    /**
     * Returns the paths/URLs of all the files in your schema (including the main schema file).
     *
     * See https://apidevtools.com/json-schema-ref-parser/docs/refs.html#pathstypes
     *
     * @param types (optional) Optionally only return certain types of paths ("file", "http", etc.)
     */
    paths(...types) {
        const paths = getPaths(this._$refs, types.flat());
        return paths.map((path) => {
            return (0, convert_path_to_posix_1.default)(path.decoded);
        });
    }
    /**
     * Returns a map of paths/URLs and their correspond values.
     *
     * See https://apidevtools.com/json-schema-ref-parser/docs/refs.html#valuestypes
     *
     * @param types (optional) Optionally only return values from certain locations ("file", "http", etc.)
     */
    values(...types) {
        const $refs = this._$refs;
        const paths = getPaths($refs, types.flat());
        return paths.reduce((obj, path) => {
            obj[(0, convert_path_to_posix_1.default)(path.decoded)] = $refs[path.encoded].value;
            return obj;
        }, {});
    }
    /**
     * Returns `true` if the given path exists in the schema; otherwise, returns `false`
     *
     * See https://apidevtools.com/json-schema-ref-parser/docs/refs.html#existsref
     *
     * @param $ref The JSON Reference path, optionally with a JSON Pointer in the hash
     */
    /**
     * Determines whether the given JSON reference exists.
     *
     * @param path - The path being resolved, optionally with a JSON pointer in the hash
     * @param [options]
     * @returns
     */
    exists(path, options) {
        try {
            this._resolve(path, "", options);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Resolves the given JSON reference and returns the resolved value.
     *
     * @param path - The path being resolved, with a JSON pointer in the hash
     * @param [options]
     * @returns - Returns the resolved value
     */
    get(path, options) {
        return this._resolve(path, "", options).value;
    }
    /**
     * Sets the value at the given path in the schema. If the property, or any of its parents, don't exist, they will be created.
     *
     * @param path The JSON Reference path, optionally with a JSON Pointer in the hash
     * @param value The value to assign. Can be anything (object, string, number, etc.)
     */
    set(path, value) {
        const absPath = url.resolve(this._root$Ref.path, path);
        const withoutHash = url.stripHash(absPath);
        const $ref = this._$refs[withoutHash];
        if (!$ref) {
            throw new Error(`Error resolving $ref pointer "${path}". \n"${withoutHash}" not found.`);
        }
        $ref.set(absPath, value);
    }
    /**
     * Returns the specified {@link $Ref} object, or undefined.
     *
     * @param path - The path being resolved, optionally with a JSON pointer in the hash
     * @returns
     * @protected
     */
    _get$Ref(path) {
        path = url.resolve(this._root$Ref.path, path);
        const withoutHash = url.stripHash(path);
        return this._$refs[withoutHash];
    }
    /**
     * Creates a new {@link $Ref} object and adds it to this {@link $Refs} object.
     *
     * @param path  - The file path or URL of the referenced file
     */
    _add(path) {
        const withoutHash = url.stripHash(path);
        const $ref = new ref_js_1.default(this);
        $ref.path = withoutHash;
        this._$refs[withoutHash] = $ref;
        this._root$Ref = this._root$Ref || $ref;
        return $ref;
    }
    /**
     * Resolves the given JSON reference.
     *
     * @param path - The path being resolved, optionally with a JSON pointer in the hash
     * @param pathFromRoot - The path of `obj` from the schema root
     * @param [options]
     * @returns
     * @protected
     */
    _resolve(path, pathFromRoot, options) {
        const absPath = url.resolve(this._root$Ref.path, path);
        const withoutHash = url.stripHash(absPath);
        const $ref = this._$refs[withoutHash];
        if (!$ref) {
            throw new Error(`Error resolving $ref pointer "${path}". \n"${withoutHash}" not found.`);
        }
        return $ref.resolve(absPath, options, path, pathFromRoot);
    }
    /**
     * A map of paths/urls to {@link $Ref} objects
     *
     * @type {object}
     * @protected
     */
    _$refs = {};
    /**
     * The {@link $Ref} object that is the root of the JSON schema.
     *
     * @type {$Ref}
     * @protected
     */
    _root$Ref;
    constructor() {
        /**
         * Indicates whether the schema contains any circular references.
         *
         * @type {boolean}
         */
        this.circular = false;
        this._$refs = {};
        // @ts-ignore
        this._root$Ref = null;
    }
    /**
     * Returns the paths of all the files/URLs that are referenced by the JSON schema,
     * including the schema itself.
     *
     * @param [types] - Only return paths of the given types ("file", "http", etc.)
     * @returns
     */
    /**
     * Returns the map of JSON references and their resolved values.
     *
     * @param [types] - Only return references of the given types ("file", "http", etc.)
     * @returns
     */
    /**
     * Returns a POJO (plain old JavaScript object) for serialization as JSON.
     *
     * @returns {object}
     */
    toJSON = this.values;
}
exports["default"] = $Refs;
/**
 * Returns the encoded and decoded paths keys of the given object.
 *
 * @param $refs - The object whose keys are URL-encoded paths
 * @param [types] - Only return paths of the given types ("file", "http", etc.)
 * @returns
 */
function getPaths($refs, types) {
    let paths = Object.keys($refs);
    // Filter the paths by type
    types = Array.isArray(types[0]) ? types[0] : Array.prototype.slice.call(types);
    if (types.length > 0 && types[0]) {
        paths = paths.filter((key) => {
            return types.includes($refs[key].pathType);
        });
    }
    // Decode local filesystem paths
    return paths.map((path) => {
        return {
            encoded: path,
            decoded: $refs[path].pathType === "file" ? url.toFileSystemPath(path, true) : path,
        };
    });
}


/***/ }),

/***/ 9084:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const ref_js_1 = __importDefault(__nccwpck_require__(43));
const pointer_js_1 = __importDefault(__nccwpck_require__(3487));
const parse_js_1 = __importDefault(__nccwpck_require__(9377));
const url = __importStar(__nccwpck_require__(4946));
const errors_js_1 = __nccwpck_require__(5260);
/**
 * Crawls the JSON schema, finds all external JSON references, and resolves their values.
 * This method does not mutate the JSON schema. The resolved values are added to {@link $RefParser#$refs}.
 *
 * NOTE: We only care about EXTERNAL references here. INTERNAL references are only relevant when dereferencing.
 *
 * @returns
 * The promise resolves once all JSON references in the schema have been resolved,
 * including nested references that are contained in externally-referenced files.
 */
function resolveExternal(parser, options) {
    if (!options.resolve?.external) {
        // Nothing to resolve, so exit early
        return Promise.resolve();
    }
    try {
        // console.log('Resolving $ref pointers in %s', parser.$refs._root$Ref.path);
        const promises = crawl(parser.schema, parser.$refs._root$Ref.path + "#", parser.$refs, options);
        return Promise.all(promises);
    }
    catch (e) {
        return Promise.reject(e);
    }
}
/**
 * Recursively crawls the given value, and resolves any external JSON references.
 *
 * @param obj - The value to crawl. If it's not an object or array, it will be ignored.
 * @param path - The full path of `obj`, possibly with a JSON Pointer in the hash
 * @param {boolean} external - Whether `obj` was found in an external document.
 * @param $refs
 * @param options
 * @param seen - Internal.
 *
 * @returns
 * Returns an array of promises. There will be one promise for each JSON reference in `obj`.
 * If `obj` does not contain any JSON references, then the array will be empty.
 * If any of the JSON references point to files that contain additional JSON references,
 * then the corresponding promise will internally reference an array of promises.
 */
function crawl(obj, path, $refs, options, seen, external) {
    seen ||= new Set();
    let promises = [];
    if (obj && typeof obj === "object" && !ArrayBuffer.isView(obj) && !seen.has(obj)) {
        seen.add(obj); // Track previously seen objects to avoid infinite recursion
        if (ref_js_1.default.isExternal$Ref(obj)) {
            promises.push(resolve$Ref(obj, path, $refs, options));
        }
        const keys = Object.keys(obj);
        for (const key of keys) {
            const keyPath = pointer_js_1.default.join(path, key);
            const value = obj[key];
            promises = promises.concat(crawl(value, keyPath, $refs, options, seen, external));
        }
    }
    return promises;
}
/**
 * Resolves the given JSON Reference, and then crawls the resulting value.
 *
 * @param $ref - The JSON Reference to resolve
 * @param path - The full path of `$ref`, possibly with a JSON Pointer in the hash
 * @param $refs
 * @param options
 *
 * @returns
 * The promise resolves once all JSON references in the object have been resolved,
 * including nested references that are contained in externally-referenced files.
 */
async function resolve$Ref($ref, path, $refs, options) {
    const shouldResolveOnCwd = options.dereference?.externalReferenceResolution === "root";
    const resolvedPath = url.resolve(shouldResolveOnCwd ? url.cwd() : path, $ref.$ref);
    const withoutHash = url.stripHash(resolvedPath);
    // $ref.$ref = url.relative($refs._root$Ref.path, resolvedPath);
    // Do we already have this $ref?
    const ref = $refs._$refs[withoutHash];
    if (ref) {
        // We've already parsed this $ref, so use the existing value
        return Promise.resolve(ref.value);
    }
    // Parse the $referenced file/url
    try {
        const result = await (0, parse_js_1.default)(resolvedPath, $refs, options);
        // Crawl the parsed value
        // console.log('Resolving $ref pointers in %s', withoutHash);
        const promises = crawl(result, withoutHash + "#", $refs, options, new Set(), true);
        return Promise.all(promises);
    }
    catch (err) {
        if (!options?.continueOnError || !(0, errors_js_1.isHandledError)(err)) {
            throw err;
        }
        if ($refs._$refs[withoutHash]) {
            err.source = decodeURI(url.stripHash(path));
            err.path = url.safePointerToPath(url.getHash(path));
        }
        return [];
    }
}
exports["default"] = resolveExternal;


/***/ }),

/***/ 7650:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const fs_1 = __importDefault(__nccwpck_require__(9896));
const url = __importStar(__nccwpck_require__(4946));
const errors_js_1 = __nccwpck_require__(5260);
exports["default"] = {
    /**
     * The order that this resolver will run, in relation to other resolvers.
     */
    order: 100,
    /**
     * Determines whether this resolver can read a given file reference.
     * Resolvers that return true will be tried, in order, until one successfully resolves the file.
     * Resolvers that return false will not be given a chance to resolve the file.
     */
    canRead(file) {
        return url.isFileSystemPath(file.url);
    },
    /**
     * Reads the given file and returns its raw contents as a Buffer.
     */
    async read(file) {
        let path;
        try {
            path = url.toFileSystemPath(file.url);
        }
        catch (err) {
            const e = err;
            e.message = `Malformed URI: ${file.url}: ${e.message}`;
            throw new errors_js_1.ResolverError(e, file.url);
        }
        // strip trailing slashes
        if (path.endsWith("/") || path.endsWith("\\")) {
            path = path.slice(0, -1);
        }
        try {
            return await fs_1.default.promises.readFile(path);
        }
        catch (err) {
            const e = err;
            e.message = `Error opening file ${path}: ${e.message}`;
            throw new errors_js_1.ResolverError(e, path);
        }
    },
};


/***/ }),

/***/ 9596:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
const url = __importStar(__nccwpck_require__(4946));
const errors_js_1 = __nccwpck_require__(5260);
exports["default"] = {
    /**
     * The order that this resolver will run, in relation to other resolvers.
     */
    order: 200,
    /**
     * HTTP headers to send when downloading files.
     *
     * @example:
     * {
     *   "User-Agent": "JSON Schema $Ref Parser",
     *   Accept: "application/json"
     * }
     */
    headers: null,
    /**
     * HTTP request timeout (in milliseconds).
     */
    timeout: 60_000, // 60 seconds
    /**
     * The maximum number of HTTP redirects to follow.
     * To disable automatic following of redirects, set this to zero.
     */
    redirects: 5,
    /**
     * The `withCredentials` option of XMLHttpRequest.
     * Set this to `true` if you're downloading files from a CORS-enabled server that requires authentication
     */
    withCredentials: false,
    /**
     * Set this to `false` if you want to allow unsafe URLs (e.g., `127.0.0.1`, localhost, and other internal URLs).
     */
    safeUrlResolver: true,
    /**
     * Determines whether this resolver can read a given file reference.
     * Resolvers that return true will be tried in order, until one successfully resolves the file.
     * Resolvers that return false will not be given a chance to resolve the file.
     */
    canRead(file) {
        return url.isHttp(file.url) && (!this.safeUrlResolver || !url.isUnsafeUrl(file.url));
    },
    /**
     * Reads the given URL and returns its raw contents as a Buffer.
     */
    read(file) {
        const u = url.parse(file.url);
        if (typeof window !== "undefined" && !u.protocol) {
            // Use the protocol of the current page
            u.protocol = url.parse(location.href).protocol;
        }
        return download(u, this);
    },
};
/**
 * Downloads the given file.
 * @returns
 * The promise resolves with the raw downloaded data, or rejects if there is an HTTP error.
 */
async function download(u, httpOptions, _redirects) {
    u = url.parse(u);
    const redirects = _redirects || [];
    redirects.push(u.href);
    try {
        const res = await get(u, httpOptions);
        if (res.status >= 400) {
            const error = new Error(`HTTP ERROR ${res.status}`);
            error.status = res.status;
            throw error;
        }
        else if (res.status >= 300) {
            if (!Number.isNaN(httpOptions.redirects) && redirects.length > httpOptions.redirects) {
                const error = new Error(`Error downloading ${redirects[0]}. \nToo many redirects: \n  ${redirects.join(" \n  ")}`);
                error.status = res.status;
                throw new errors_js_1.ResolverError(error);
            }
            else if (!("location" in res.headers) || !res.headers.location) {
                const error = new Error(`HTTP ${res.status} redirect with no location header`);
                error.status = res.status;
                throw error;
            }
            else {
                const redirectTo = url.resolve(u.href, res.headers.location);
                return download(redirectTo, httpOptions, redirects);
            }
        }
        else {
            if (res.body) {
                const buf = await res.arrayBuffer();
                return Buffer.from(buf);
            }
            return Buffer.alloc(0);
        }
    }
    catch (err) {
        const e = err;
        e.message = `Error downloading ${u.href}: ${e.message}`;
        throw new errors_js_1.ResolverError(e, u.href);
    }
}
/**
 * Sends an HTTP GET request.
 * The promise resolves with the HTTP Response object.
 */
async function get(u, httpOptions) {
    let controller;
    let timeoutId;
    if (httpOptions.timeout) {
        controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), httpOptions.timeout);
    }
    const response = await fetch(u, {
        method: "GET",
        headers: httpOptions.headers || {},
        credentials: httpOptions.withCredentials ? "include" : "same-origin",
        signal: controller ? controller.signal : null,
    });
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    return response;
}


/***/ }),

/***/ 7348:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports["default"] = convertPathToPosix;
const path_1 = __importDefault(__nccwpck_require__(6928));
function convertPathToPosix(filePath) {
    const isExtendedLengthPath = filePath.startsWith("\\\\?\\");
    if (isExtendedLengthPath) {
        return filePath;
    }
    return filePath.split(path_1.default?.win32?.sep).join(path_1.default?.posix?.sep ?? "/");
}


/***/ }),

/***/ 5260:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InvalidPointerError = exports.TimeoutError = exports.MissingPointerError = exports.UnmatchedResolverError = exports.ResolverError = exports.UnmatchedParserError = exports.ParserError = exports.JSONParserErrorGroup = exports.JSONParserError = void 0;
exports.toJSON = toJSON;
exports.getDeepKeys = getDeepKeys;
exports.isHandledError = isHandledError;
exports.normalizeError = normalizeError;
const url_js_1 = __nccwpck_require__(4946);
const nonJsonTypes = ["function", "symbol", "undefined"];
const protectedProps = ["constructor", "prototype", "__proto__"];
const objectPrototype = Object.getPrototypeOf({});
/**
 * Custom JSON serializer for Error objects.
 * Returns all built-in error properties, as well as extended properties.
 */
function toJSON() {
    // HACK: We have to cast the objects to `any` so we can use symbol indexers.
    // see https://github.com/Microsoft/TypeScript/issues/1863
    const pojo = {};
    const error = this;
    for (const key of getDeepKeys(error)) {
        if (typeof key === "string") {
            const value = error[key];
            const type = typeof value;
            if (!nonJsonTypes.includes(type)) {
                pojo[key] = value;
            }
        }
    }
    return pojo;
}
/**
 * Returns own, inherited, enumerable, non-enumerable, string, and symbol keys of `obj`.
 * Does NOT return members of the base Object prototype, or the specified omitted keys.
 */
function getDeepKeys(obj, omit = []) {
    let keys = [];
    // Crawl the prototype chain, finding all the string and symbol keys
    while (obj && obj !== objectPrototype) {
        keys = keys.concat(Object.getOwnPropertyNames(obj), Object.getOwnPropertySymbols(obj));
        obj = Object.getPrototypeOf(obj);
    }
    // De-duplicate the list of keys
    const uniqueKeys = new Set(keys);
    // Remove any omitted keys
    for (const key of omit.concat(protectedProps)) {
        uniqueKeys.delete(key);
    }
    return uniqueKeys;
}
class JSONParserError extends Error {
    name;
    message;
    source;
    path;
    code;
    constructor(message, source) {
        super();
        this.code = "EUNKNOWN";
        this.name = "JSONParserError";
        this.message = message;
        this.source = source;
        this.path = null;
    }
    toJSON = toJSON.bind(this);
    get footprint() {
        return `${this.path}+${this.source}+${this.code}+${this.message}`;
    }
}
exports.JSONParserError = JSONParserError;
class JSONParserErrorGroup extends Error {
    files;
    constructor(parser) {
        super();
        this.files = parser;
        this.name = "JSONParserErrorGroup";
        this.message = `${this.errors.length} error${this.errors.length > 1 ? "s" : ""} occurred while reading '${(0, url_js_1.toFileSystemPath)(parser.$refs._root$Ref.path)}'`;
    }
    toJSON = toJSON.bind(this);
    static getParserErrors(parser) {
        const errors = [];
        for (const $ref of Object.values(parser.$refs._$refs)) {
            if ($ref.errors) {
                errors.push(...$ref.errors);
            }
        }
        return errors;
    }
    get errors() {
        return JSONParserErrorGroup.getParserErrors(this.files);
    }
}
exports.JSONParserErrorGroup = JSONParserErrorGroup;
class ParserError extends JSONParserError {
    code = "EPARSER";
    name = "ParserError";
    constructor(message, source) {
        super(`Error parsing ${source}: ${message}`, source);
    }
}
exports.ParserError = ParserError;
class UnmatchedParserError extends JSONParserError {
    code = "EUNMATCHEDPARSER";
    name = "UnmatchedParserError";
    constructor(source) {
        super(`Could not find parser for "${source}"`, source);
    }
}
exports.UnmatchedParserError = UnmatchedParserError;
class ResolverError extends JSONParserError {
    code = "ERESOLVER";
    name = "ResolverError";
    ioErrorCode;
    constructor(ex, source) {
        super(ex.message || `Error reading file "${source}"`, source);
        if ("code" in ex) {
            this.ioErrorCode = String(ex.code);
        }
    }
}
exports.ResolverError = ResolverError;
class UnmatchedResolverError extends JSONParserError {
    code = "EUNMATCHEDRESOLVER";
    name = "UnmatchedResolverError";
    constructor(source) {
        super(`Could not find resolver for "${source}"`, source);
    }
}
exports.UnmatchedResolverError = UnmatchedResolverError;
class MissingPointerError extends JSONParserError {
    code = "EMISSINGPOINTER";
    name = "MissingPointerError";
    targetToken;
    targetRef;
    targetFound;
    parentPath;
    constructor(token, path, targetRef, targetFound, parentPath) {
        super(`Missing $ref pointer "${(0, url_js_1.getHash)(path)}". Token "${token}" does not exist.`, (0, url_js_1.stripHash)(path));
        this.targetToken = token;
        this.targetRef = targetRef;
        this.targetFound = targetFound;
        this.parentPath = parentPath;
    }
}
exports.MissingPointerError = MissingPointerError;
class TimeoutError extends JSONParserError {
    code = "ETIMEOUT";
    name = "TimeoutError";
    constructor(timeout) {
        super(`Dereferencing timeout reached: ${timeout}ms`);
    }
}
exports.TimeoutError = TimeoutError;
class InvalidPointerError extends JSONParserError {
    code = "EUNMATCHEDRESOLVER";
    name = "InvalidPointerError";
    constructor(pointer, path) {
        super(`Invalid $ref pointer "${pointer}". Pointers must begin with "#/"`, (0, url_js_1.stripHash)(path));
    }
}
exports.InvalidPointerError = InvalidPointerError;
function isHandledError(err) {
    return err instanceof JSONParserError || err instanceof JSONParserErrorGroup;
}
function normalizeError(err) {
    if (err.path === null) {
        err.path = [];
    }
    return err;
}


/***/ }),

/***/ 2651:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isWindows = void 0;
const isWindowsConst = /^win/.test(globalThis.process ? globalThis.process.platform : "");
const isWindows = () => isWindowsConst;
exports.isWindows = isWindows;


/***/ }),

/***/ 5091:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports["default"] = maybe;
const next_js_1 = __importDefault(__nccwpck_require__(9298));
function maybe(cb, promise) {
    if (cb) {
        promise.then(function (result) {
            (0, next_js_1.default)(function () {
                cb(null, result);
            });
        }, function (err) {
            (0, next_js_1.default)(function () {
                cb(err);
            });
        });
        return undefined;
    }
    else {
        return promise;
    }
}


/***/ }),

/***/ 9298:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
function makeNext() {
    if (typeof process === "object" && typeof process.nextTick === "function") {
        return process.nextTick;
    }
    else if (typeof setImmediate === "function") {
        return setImmediate;
    }
    else {
        return function next(f) {
            setTimeout(f, 0);
        };
    }
}
exports["default"] = makeNext();


/***/ }),

/***/ 2247:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.all = all;
exports.filter = filter;
exports.sort = sort;
exports.run = run;
/**
 * Returns the given plugins as an array, rather than an object map.
 * All other methods in this module expect an array of plugins rather than an object map.
 *
 * @returns
 */
function all(plugins) {
    return Object.keys(plugins || {})
        .filter((key) => {
        return typeof plugins[key] === "object";
    })
        .map((key) => {
        plugins[key].name = key;
        return plugins[key];
    });
}
/**
 * Filters the given plugins, returning only the ones return `true` for the given method.
 */
function filter(plugins, method, file) {
    return plugins.filter((plugin) => {
        return !!getResult(plugin, method, file);
    });
}
/**
 * Sorts the given plugins, in place, by their `order` property.
 */
function sort(plugins) {
    for (const plugin of plugins) {
        plugin.order = plugin.order || Number.MAX_SAFE_INTEGER;
    }
    return plugins.sort((a, b) => {
        return a.order - b.order;
    });
}
/**
 * Runs the specified method of the given plugins, in order, until one of them returns a successful result.
 * Each method can return a synchronous value, a Promise, or call an error-first callback.
 * If the promise resolves successfully, or the callback is called without an error, then the result
 * is immediately returned and no further plugins are called.
 * If the promise rejects, or the callback is called with an error, then the next plugin is called.
 * If ALL plugins fail, then the last error is thrown.
 */
async function run(plugins, method, file, $refs) {
    let plugin;
    let lastError;
    let index = 0;
    return new Promise((resolve, reject) => {
        runNextPlugin();
        function runNextPlugin() {
            plugin = plugins[index++];
            if (!plugin) {
                // There are no more functions, so re-throw the last error
                return reject(lastError);
            }
            try {
                // console.log('  %s', plugin.name);
                const result = getResult(plugin, method, file, callback, $refs);
                if (result && typeof result.then === "function") {
                    // A promise was returned
                    result.then(onSuccess, onError);
                }
                else if (result !== undefined) {
                    // A synchronous result was returned
                    onSuccess(result);
                }
                else if (index === plugins.length) {
                    throw new Error("No promise has been returned or callback has been called.");
                }
            }
            catch (e) {
                onError(e);
            }
        }
        function callback(err, result) {
            if (err) {
                onError(err);
            }
            else {
                onSuccess(result);
            }
        }
        function onSuccess(result) {
            // console.log('    success');
            resolve({
                plugin,
                result: result,
            });
        }
        function onError(error) {
            // console.log('    %s', err.message || err);
            lastError = {
                plugin,
                error,
            };
            runNextPlugin();
        }
    });
}
/**
 * Returns the value of the given property.
 * If the property is a function, then the result of the function is returned.
 * If the value is a RegExp, then it will be tested against the file URL.
 * If the value is an array, then it will be compared against the file extension.
 */
function getResult(obj, prop, file, callback, $refs) {
    const value = obj[prop];
    if (typeof value === "function") {
        return value.apply(obj, [file, callback, $refs]);
    }
    if (!callback) {
        // The synchronous plugin functions (canParse and canRead)
        // allow a "shorthand" syntax, where the user can match
        // files by RegExp or by file extension.
        if (value instanceof RegExp) {
            return value.test(file.url);
        }
        else if (typeof value === "string") {
            return value === file.extension;
        }
        else if (Array.isArray(value)) {
            return value.indexOf(file.extension) !== -1;
        }
    }
    return value;
}


/***/ }),

/***/ 4946:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
exports.resolve = resolve;
exports.cwd = cwd;
exports.getProtocol = getProtocol;
exports.getExtension = getExtension;
exports.stripQuery = stripQuery;
exports.getHash = getHash;
exports.stripHash = stripHash;
exports.isHttp = isHttp;
exports.isUnsafeUrl = isUnsafeUrl;
exports.isFileSystemPath = isFileSystemPath;
exports.fromFileSystemPath = fromFileSystemPath;
exports.toFileSystemPath = toFileSystemPath;
exports.safePointerToPath = safePointerToPath;
exports.relative = relative;
const convert_path_to_posix_1 = __importDefault(__nccwpck_require__(7348));
const path_1 = __importStar(__nccwpck_require__(6928));
const forwardSlashPattern = /\//g;
const protocolPattern = /^(\w{2,}):\/\//i;
const jsonPointerSlash = /~1/g;
const jsonPointerTilde = /~0/g;
const path_2 = __nccwpck_require__(6928);
const is_windows_1 = __nccwpck_require__(2651);
// RegExp patterns to URL-encode special characters in local filesystem paths
const urlEncodePatterns = [
    [/\?/g, "%3F"],
    [/#/g, "%23"],
];
// RegExp patterns to URL-decode special characters for local filesystem paths
const urlDecodePatterns = [/%23/g, "#", /%24/g, "$", /%26/g, "&", /%2C/g, ",", /%40/g, "@"];
const parse = (u) => new URL(u);
exports.parse = parse;
/**
 * Returns resolved target URL relative to a base URL in a manner similar to that of a Web browser resolving an anchor tag HREF.
 *
 * @returns
 */
function resolve(from, to) {
    // we use a non-existent URL to check if its a relative URL
    const fromUrl = new URL((0, convert_path_to_posix_1.default)(from), "https://aaa.nonexistanturl.com");
    const resolvedUrl = new URL((0, convert_path_to_posix_1.default)(to), fromUrl);
    const endSpaces = to.match(/(\s*)$/)?.[1] || "";
    if (resolvedUrl.hostname === "aaa.nonexistanturl.com") {
        // `from` is a relative URL.
        const { pathname, search, hash } = resolvedUrl;
        return pathname + search + hash + endSpaces;
    }
    return resolvedUrl.toString() + endSpaces;
}
/**
 * Returns the current working directory (in Node) or the current page URL (in browsers).
 *
 * @returns
 */
function cwd() {
    if (typeof window !== "undefined" && window.location && window.location.href) {
        const href = window.location.href;
        if (!href || !href.startsWith("http")) {
            // try parsing as url, and if it fails, return root url /
            try {
                new URL(href);
                return href;
            }
            catch {
                return "/";
            }
        }
        return href;
    }
    if (typeof process !== "undefined" && process.cwd) {
        const path = process.cwd();
        const lastChar = path.slice(-1);
        if (lastChar === "/" || lastChar === "\\") {
            return path;
        }
        else {
            return path + "/";
        }
    }
    return "/";
}
/**
 * Returns the protocol of the given URL, or `undefined` if it has no protocol.
 *
 * @param path
 * @returns
 */
function getProtocol(path) {
    const match = protocolPattern.exec(path || "");
    if (match) {
        return match[1].toLowerCase();
    }
    return undefined;
}
/**
 * Returns the lowercased file extension of the given URL,
 * or an empty string if it has no extension.
 *
 * @param path
 * @returns
 */
function getExtension(path) {
    const lastDot = path.lastIndexOf(".");
    if (lastDot >= 0) {
        return stripQuery(path.substring(lastDot).toLowerCase());
    }
    return "";
}
/**
 * Removes the query, if any, from the given path.
 *
 * @param path
 * @returns
 */
function stripQuery(path) {
    const queryIndex = path.indexOf("?");
    if (queryIndex >= 0) {
        path = path.substring(0, queryIndex);
    }
    return path;
}
/**
 * Returns the hash (URL fragment), of the given path.
 * If there is no hash, then the root hash ("#") is returned.
 *
 * @param path
 * @returns
 */
function getHash(path) {
    if (!path) {
        return "#";
    }
    const hashIndex = path.indexOf("#");
    if (hashIndex >= 0) {
        return path.substring(hashIndex);
    }
    return "#";
}
/**
 * Removes the hash (URL fragment), if any, from the given path.
 *
 * @param path
 * @returns
 */
function stripHash(path) {
    if (!path) {
        return "";
    }
    const hashIndex = path.indexOf("#");
    if (hashIndex >= 0) {
        path = path.substring(0, hashIndex);
    }
    return path;
}
/**
 * Determines whether the given path is an HTTP(S) URL.
 *
 * @param path
 * @returns
 */
function isHttp(path) {
    const protocol = getProtocol(path);
    if (protocol === "http" || protocol === "https") {
        return true;
    }
    else if (protocol === undefined) {
        // There is no protocol.  If we're running in a browser, then assume it's HTTP.
        return typeof window !== "undefined";
    }
    else {
        // It's some other protocol, such as "ftp://", "mongodb://", etc.
        return false;
    }
}
/**
 * Determines whether the given url is an unsafe or internal url.
 *
 * @param path - The URL or path to check
 * @returns true if the URL is unsafe/internal, false otherwise
 */
function isUnsafeUrl(path) {
    if (!path || typeof path !== "string") {
        return true;
    }
    // Trim whitespace and convert to lowercase for comparison
    const normalizedPath = path.trim().toLowerCase();
    // Empty or just whitespace
    if (!normalizedPath) {
        return true;
    }
    // JavaScript protocols
    if (normalizedPath.startsWith("javascript:") ||
        normalizedPath.startsWith("vbscript:") ||
        normalizedPath.startsWith("data:")) {
        return true;
    }
    // File protocol
    if (normalizedPath.startsWith("file:")) {
        return true;
    }
    // if we're in the browser, we assume that it is safe
    if (typeof window !== "undefined" && window.location && window.location.href) {
        return false;
    }
    // Local/internal network addresses
    const localPatterns = [
        // Localhost variations
        "localhost",
        "127.0.0.1",
        "::1",
        // Private IP ranges (RFC 1918)
        "10.",
        "172.16.",
        "172.17.",
        "172.18.",
        "172.19.",
        "172.20.",
        "172.21.",
        "172.22.",
        "172.23.",
        "172.24.",
        "172.25.",
        "172.26.",
        "172.27.",
        "172.28.",
        "172.29.",
        "172.30.",
        "172.31.",
        "192.168.",
        // Link-local addresses
        "169.254.",
        // Internal domains
        ".local",
        ".internal",
        ".intranet",
        ".corp",
        ".home",
        ".lan",
    ];
    try {
        // Try to parse as URL
        const url = new URL(normalizedPath.startsWith("//") ? "http:" + normalizedPath : normalizedPath);
        const hostname = url.hostname.toLowerCase();
        // Check against local patterns
        for (const pattern of localPatterns) {
            if (hostname === pattern || hostname.startsWith(pattern) || hostname.endsWith(pattern)) {
                return true;
            }
        }
        // Check for IP addresses in private ranges
        if (isPrivateIP(hostname)) {
            return true;
        }
        // Check for non-standard ports that might indicate internal services
        const port = url.port;
        if (port && isInternalPort(parseInt(port))) {
            return true;
        }
    }
    catch {
        // If URL parsing fails, check if it's a relative path or contains suspicious patterns
        // Relative paths starting with / are generally safe for same-origin
        if (normalizedPath.startsWith("/") && !normalizedPath.startsWith("//")) {
            return false;
        }
        // Check for localhost patterns in non-URL strings
        for (const pattern of localPatterns) {
            if (normalizedPath.includes(pattern)) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Helper function to check if an IP address is in a private range
 */
function isPrivateIP(ip) {
    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipRegex);
    if (!match) {
        return false;
    }
    const [, a, b, c, d] = match.map(Number);
    // Validate IP format
    if (a > 255 || b > 255 || c > 255 || d > 255) {
        return false;
    }
    // Private IP ranges
    return (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) // Link-local
    );
}
/**
 * Helper function to check if a port is typically used for internal services
 */
function isInternalPort(port) {
    const internalPorts = [
        22, // SSH
        23, // Telnet
        25, // SMTP
        53, // DNS
        135, // RPC
        139, // NetBIOS
        445, // SMB
        993, // IMAPS
        995, // POP3S
        1433, // SQL Server
        1521, // Oracle
        3306, // MySQL
        3389, // RDP
        5432, // PostgreSQL
        5900, // VNC
        6379, // Redis
        8080, // Common internal web
        8443, // Common internal HTTPS
        9200, // Elasticsearch
        27017, // MongoDB
    ];
    return internalPorts.includes(port);
}
/**
 * Determines whether the given path is a filesystem path.
 * This includes "file://" URLs.
 *
 * @param path
 * @returns
 */
function isFileSystemPath(path) {
    // @ts-ignore
    if (typeof window !== "undefined" || (typeof process !== "undefined" && process.browser)) {
        // We're running in a browser, so assume that all paths are URLs.
        // This way, even relative paths will be treated as URLs rather than as filesystem paths
        return false;
    }
    const protocol = getProtocol(path);
    return protocol === undefined || protocol === "file";
}
/**
 * Converts a filesystem path to a properly-encoded URL.
 *
 * This is intended to handle situations where JSON Schema $Ref Parser is called
 * with a filesystem path that contains characters which are not allowed in URLs.
 *
 * @example
 * The following filesystem paths would be converted to the following URLs:
 *
 *    <"!@#$%^&*+=?'>.json              ==>   %3C%22!@%23$%25%5E&*+=%3F\'%3E.json
 *    C:\\My Documents\\File (1).json   ==>   C:/My%20Documents/File%20(1).json
 *    file://Project #42/file.json      ==>   file://Project%20%2342/file.json
 *
 * @param path
 * @returns
 */
function fromFileSystemPath(path) {
    // Step 1: On Windows, replace backslashes with forward slashes,
    // rather than encoding them as "%5C"
    if ((0, is_windows_1.isWindows)()) {
        const projectDir = cwd();
        const upperPath = path.toUpperCase();
        const projectDirPosixPath = (0, convert_path_to_posix_1.default)(projectDir);
        const posixUpper = projectDirPosixPath.toUpperCase();
        const hasProjectDir = upperPath.includes(posixUpper);
        const hasProjectUri = upperPath.includes(posixUpper);
        const isAbsolutePath = path_1.win32?.isAbsolute(path) ||
            path.startsWith("http://") ||
            path.startsWith("https://") ||
            path.startsWith("file://");
        if (!(hasProjectDir || hasProjectUri || isAbsolutePath) && !projectDir.startsWith("http")) {
            path = (0, path_2.join)(projectDir, path);
        }
        path = (0, convert_path_to_posix_1.default)(path);
    }
    // Step 2: `encodeURI` will take care of MOST characters
    path = encodeURI(path);
    // Step 3: Manually encode characters that are not encoded by `encodeURI`.
    // This includes characters such as "#" and "?", which have special meaning in URLs,
    // but are just normal characters in a filesystem path.
    for (const pattern of urlEncodePatterns) {
        path = path.replace(pattern[0], pattern[1]);
    }
    return path;
}
/**
 * Converts a URL to a local filesystem path.
 */
function toFileSystemPath(path, keepFileProtocol) {
    // Step 1: `decodeURI` will decode characters such as Cyrillic characters, spaces, etc.
    path = decodeURI(path);
    // Step 2: Manually decode characters that are not decoded by `decodeURI`.
    // This includes characters such as "#" and "?", which have special meaning in URLs,
    // but are just normal characters in a filesystem path.
    for (let i = 0; i < urlDecodePatterns.length; i += 2) {
        path = path.replace(urlDecodePatterns[i], urlDecodePatterns[i + 1]);
    }
    // Step 3: If it's a "file://" URL, then format it consistently
    // or convert it to a local filesystem path
    let isFileUrl = path.toLowerCase().startsWith("file://");
    if (isFileUrl) {
        // Strip-off the protocol, and the initial "/", if there is one
        path = path.replace(/^file:\/\//, "").replace(/^\//, "");
        // insert a colon (":") after the drive letter on Windows
        if ((0, is_windows_1.isWindows)() && path[1] === "/") {
            path = `${path[0]}:${path.substring(1)}`;
        }
        if (keepFileProtocol) {
            // Return the consistently-formatted "file://" URL
            path = "file:///" + path;
        }
        else {
            // Convert the "file://" URL to a local filesystem path.
            // On Windows, it will start with something like "C:/".
            // On Posix, it will start with "/"
            isFileUrl = false;
            path = (0, is_windows_1.isWindows)() ? path : "/" + path;
        }
    }
    // Step 4: Normalize Windows paths (unless it's a "file://" URL)
    if ((0, is_windows_1.isWindows)() && !isFileUrl) {
        // Replace forward slashes with backslashes
        path = path.replace(forwardSlashPattern, "\\");
        // Capitalize the drive letter
        if (path.match(/^[a-z]:\\/i)) {
            path = path[0].toUpperCase() + path.substring(1);
        }
    }
    return path;
}
/**
 * Converts a $ref pointer to a valid JSON Path.
 *
 * @param pointer
 * @returns
 */
function safePointerToPath(pointer) {
    if (pointer.length <= 1 || pointer[0] !== "#" || pointer[1] !== "/") {
        return [];
    }
    return pointer
        .slice(2)
        .split("/")
        .map((value) => {
        return decodeURIComponent(value).replace(jsonPointerSlash, "/").replace(jsonPointerTilde, "~");
    });
}
function relative(from, to) {
    if (!isFileSystemPath(from) || !isFileSystemPath(to)) {
        return resolve(from, to);
    }
    const fromDir = path_1.default.dirname(stripHash(from));
    const toPath = stripHash(to);
    const result = path_1.default.relative(fromDir, toPath);
    return result + getHash(to);
}


/***/ }),

/***/ 5483:
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({ value: true }));

/**
 * @fileoverview JSON syntax helpers
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Predefined Tokens
//-----------------------------------------------------------------------------

const LBRACKET = "[";
const RBRACKET = "]";
const LBRACE = "{";
const RBRACE = "}";
const COLON = ":";
const COMMA = ",";

const TRUE = "true";
const FALSE = "false";
const NULL = "null";

const QUOTE = "\"";

const expectedKeywords = new Map([
    ["t", TRUE],
    ["f", FALSE],
    ["n", NULL]
]);

const escapeToChar = new Map([
    [QUOTE, QUOTE],
    ["\\", "\\"],
    ["/", "/"],
    ["b", "\b"],
    ["n", "\n"],
    ["f", "\f"],
    ["r", "\r"],
    ["t", "\t"]
]);

const knownTokenTypes = new Map([
    [LBRACKET, "Punctuator"],
    [RBRACKET, "Punctuator"],
    [LBRACE, "Punctuator"],
    [RBRACE, "Punctuator"],
    [COLON, "Punctuator"],
    [COMMA, "Punctuator"],
    [TRUE, "Boolean"],
    [FALSE, "Boolean"],
    [NULL, "Null"]
]);

/**
 * @fileoverview JSON tokenization/parsing errors
 * @author Nicholas C. Zakas
 */


/**
 * Base class that attaches location to an error.
 */
class ErrorWithLocation extends Error {

    /**
     * 
     * @param {string} message The error message to report. 
     * @param {int} loc.line The line on which the error occurred.
     * @param {int} loc.column The column in the line where the error occurrred.
     * @param {int} loc.index The index in the string where the error occurred.
     */
    constructor(message, { line, column, index }) {
        super(`${ message } (${ line }:${ column})`);

        /**
         * The line on which the error occurred.
         * @type int
         * @property line
         */
        this.line = line;

        /**
         * The column on which the error occurred.
         * @type int
         * @property column
         */
        this.column = column;
        
        /**
         * The index into the string where the error occurred.
         * @type int
         * @property index
         */
        this.index = index;
    }

}

/**
 * Error thrown when an unexpected character is found during tokenizing.
 */
class UnexpectedChar extends ErrorWithLocation {

    /**
     * Creates a new instance.
     * @param {string} unexpected The character that was found.
     * @param {Object} loc The location information for the found character.
     */
    constructor(unexpected, loc) {
        super(`Unexpected character ${ unexpected } found.`, loc);
    }
}

/**
 * Error thrown when an unexpected token is found during parsing.
 */
class UnexpectedToken extends ErrorWithLocation {

    /**
     * Creates a new instance.
     * @param {string} expected The character that was expected. 
     * @param {string} unexpected The character that was found.
     * @param {Object} loc The location information for the found character.
     */
    constructor(token) {
        super(`Unexpected token ${ token.type }(${ token.value }) found.`, token.loc.start);
    }
}

/**
 * Error thrown when the end of input is found where it isn't expected.
 */
class UnexpectedEOF extends ErrorWithLocation {

    /**
     * Creates a new instance.
     * @param {Object} loc The location information for the found character.
     */
    constructor(loc) {
        super("Unexpected end of input found.", loc);
    }
}

/**
 * @fileoverview JSON tokenizer
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const QUOTE$1 = "\"";
const SLASH = "/";
const STAR = "*";

const DEFAULT_OPTIONS = {
    comments: false,
    ranges: false
};

function isWhitespace(c) {
    return /[\s\n]/.test(c);
}

function isDigit(c) {
    return c >= "0" && c <= "9";
}

function isHexDigit(c) {
    return isDigit(c) || /[a-f]/i.test(c);
}

function isPositiveDigit(c) {
    return c >= "1" && c <= "9";
}

function isKeywordStart(c) {
    return /[tfn]/.test(c);
}

function isNumberStart(c) {
    return isDigit(c) || c === "." || c === "-";
}

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------

/**
 * Creates an iterator over the tokens representing the source text.
 * @param {string} text The source text to tokenize.
 * @returns {Iterator} An iterator over the tokens. 
 */
function tokenize(text, options) {

    options = Object.freeze({
        ...DEFAULT_OPTIONS,
        ...options
    });

    let offset = -1;
    let line = 1;
    let column = 0;
    let newLine = false;

    const tokens = [];


    function createToken(tokenType, value, startLoc, endLoc) {
        
        const endOffset = startLoc.offset + value.length;
        let range = options.ranges ? {
            range: [startLoc.offset, endOffset]
        } : undefined;
        
        return {
            type: tokenType,
            value,
            loc: {
                start: startLoc,
                end: endLoc || {
                    line: startLoc.line,
                    column: startLoc.column + value.length,
                    offset: endOffset
                }
            },
            ...range
        };
    }

    function next() {
        let c = text.charAt(++offset);
    
        if (newLine) {
            line++;
            column = 1;
            newLine = false;
        } else {
            column++;
        }

        if (c === "\r") {
            newLine = true;

            // if we already see a \r, just ignore upcoming \n
            if (text.charAt(offset + 1) === "\n") {
                offset++;
            }
        } else if (c === "\n") {
            newLine = true;
        }

        return c;
    }

    function locate() {
        return {
            line,
            column,
            offset
        };
    }

    function readKeyword(c) {

        // get the expected keyword
        let value = expectedKeywords.get(c);

        // check to see if it actually exists
        if (text.slice(offset, offset + value.length) === value) {
            offset += value.length - 1;
            column += value.length - 1;
            return { value, c: next() };
        }

        // find the first unexpected character
        for (let j = 1; j < value.length; j++) {
            if (value[j] !== text.charAt(offset + j)) {
                unexpected(next());
            }
        }

    }

    function readString(c) {
        let value = c;
        c = next();

        while (c && c !== QUOTE$1) {

            // escapes
            if (c === "\\") {
                value += c;
                c = next();

                if (escapeToChar.has(c)) {
                    value += c;
                } else if (c === "u") {
                    value += c;
                    for (let i = 0; i < 4; i++) {
                        c = next();
                        if (isHexDigit(c)) {
                            value += c;
                        } else {
                            unexpected(c);
                        }
                    }
                } else {
                    unexpected(c);
                }
            } else {
                value += c;
            }

            c = next();
        }

        if (!c) {
            unexpectedEOF();
        }
        
        value += c;

        return { value, c: next() };
    }


    function readNumber(c) {

        let value = "";

        // Number may start with a minus but not a plus
        if (c === "-") {

            value += c;

            c = next();

            // Next digit cannot be zero
            if (!isDigit(c)) {
                unexpected(c);
            }

        }

        // Zero must be followed by a decimal point or nothing
        if (c === "0") {

            value += c;

            c = next();
            if (isDigit(c)) {
                unexpected(c);
            }

        } else {
            if (!isPositiveDigit(c)) {
                unexpected(c);
            }

            do {
                value += c;
                c = next();
            } while (isDigit(c));
        }

        // Decimal point may be followed by any number of digits
        if (c === ".") {

            do {
                value += c;
                c = next();
            } while (isDigit(c));
        }

        // Exponent is always last
        if (c === "e" || c === "E") {

            value += c;
            c = next();

            if (c === "+" || c === "-") {
                value += c;
                c = next();
            }

            /*
             * Must always have a digit in this position to avoid:
             * 5e
             * 12E+
             * 42e-
             */
            if (!isDigit(c)) {
                unexpected(c);
            }

            while (isDigit(c)) {
                value += c;
                c = next();
            }
        }


        return { value, c };
    }

    /**
     * Reads in either a single-line or multi-line comment.
     * @param {string} c The first character of the comment.
     * @returns {string} The comment string.
     * @throws {UnexpectedChar} when the comment cannot be read.
     * @throws {UnexpectedEOF} when EOF is reached before the comment is
     *      finalized.
     */
    function readComment(c) {

        let value = c;

        // next character determines single- or multi-line
        c = next();

        // single-line comments
        if (c === "/") {
            
            do {
                value += c;
                c = next();
            } while (c && c !== "\r" && c !== "\n");

            return { value, c };
        }

        // multi-line comments
        if (c === STAR) {

            while (c) {
                value += c;
                c = next();

                // check for end of comment
                if (c === STAR) {
                    value += c;
                    c = next();
                    
                    //end of comment
                    if (c === SLASH) {
                        value += c;

                        /*
                         * The single-line comment functionality cues up the
                         * next character, so we do the same here to avoid
                         * splitting logic later.
                         */
                        c = next();
                        return { value, c };
                    }
                }
            }

            unexpectedEOF();
            
        }

        // if we've made it here, there's an invalid character
        unexpected(c);        
    }


    /**
     * Convenience function for throwing unexpected character errors.
     * @param {string} c The unexpected character.
     * @returns {void}
     * @throws {UnexpectedChar} always.
     */
    function unexpected(c) {
        throw new UnexpectedChar(c, locate());
    }

    /**
     * Convenience function for throwing unexpected EOF errors.
     * @returns {void}
     * @throws {UnexpectedEOF} always.
     */
    function unexpectedEOF() {
        throw new UnexpectedEOF(locate());
    }

    let c = next();

    while (offset < text.length) {

        while (isWhitespace(c)) {
            c = next();
        }

        if (!c) {
            break;
        }

        const start = locate();

        // check for easy case
        if (knownTokenTypes.has(c)) {
            tokens.push(createToken(knownTokenTypes.get(c), c, start));
            c = next();
        } else if (isKeywordStart(c)) {
            const result = readKeyword(c);
            let value = result.value;
            c = result.c;
            tokens.push(createToken(knownTokenTypes.get(value), value, start));
        } else if (isNumberStart(c)) {
            const result = readNumber(c);
            let value = result.value;
            c = result.c;
            tokens.push(createToken("Number", value, start));
        } else if (c === QUOTE$1) {
            const result = readString(c);
            let value = result.value;
            c = result.c;
            tokens.push(createToken("String", value, start));
        } else if (c === SLASH && options.comments) {
            const result = readComment(c);
            let value = result.value;
            c = result.c;
            tokens.push(createToken(value.startsWith("//") ? "LineComment" : "BlockComment", value, start, locate()));
        } else {
            unexpected(c);
        }
    }

    return tokens;

}

/**
 * @fileoverview Momoa JSON AST types
 * @author Nicholas C. Zakas
 */

const types = {
    document(body, parts = {}) {
        return {
            type: "Document",
            body,
            ...parts
        };
    },
    string(value, parts = {}) {
        return {
            type: "String",
            value,
            ...parts
        };
    },
    number(value, parts = {}) {
        return {
            type: "Number",
            value,
            ...parts
        };
    },
    boolean(value, parts = {}) {
        return {
            type: "Boolean",
            value,
            ...parts
        };
    },
    null(parts = {}) {
        return {
            type: "Null",
            value: "null",
            ...parts
        };
    },
    array(elements, parts = {}) {
        return {
            type: "Array",
            elements,
            ...parts
        };
    },
    object(members, parts = {}) {
        return {
            type: "Object",
            members,
            ...parts
        };
    },
    member(name, value, parts = {}) {
        return {
            type: "Member",
            name,
            value,
            ...parts
        };
    },

};

/**
 * @fileoverview JSON parser
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const DEFAULT_OPTIONS$1 = {
    tokens: false,
    comments: false,
    ranges: false
};

/**
 * Converts a JSON-encoded string into a JavaScript string, interpreting each
 * escape sequence.
 * @param {Token} token The string token to convert into a JavaScript string.
 * @returns {string} A JavaScript string.
 */
function getStringValue(token) {
    
    // slice off the quotation marks
    let value = token.value.slice(1, -1);
    let result = "";
    let escapeIndex = value.indexOf("\\");
    let lastIndex = 0;

    // While there are escapes, interpret them to build up the result
    while (escapeIndex >= 0) {

        // append the text that happened before the escape
        result += value.slice(lastIndex, escapeIndex);

        // get the character immediately after the \
        const escapeChar = value.charAt(escapeIndex + 1);
        
        // check for the non-Unicode escape sequences first
        if (escapeToChar.has(escapeChar)) {
            result += escapeToChar.get(escapeChar);
            lastIndex = escapeIndex + 2;
        } else if (escapeChar === "u") {
            const hexCode = value.slice(escapeIndex + 2, escapeIndex + 6);
            if (hexCode.length < 4 || /[^0-9a-f]/i.test(hexCode)) {
                throw new ErrorWithLocation(
                    `Invalid unicode escape \\u${ hexCode}.`,
                    {
                        line: token.loc.start.line,
                        column: token.loc.start.column + escapeIndex,
                        offset: token.loc.start.offset + escapeIndex
                    }
                );
            }
            
            result += String.fromCharCode(parseInt(hexCode, 16));
            lastIndex = escapeIndex + 6;
        } else {
            throw new ErrorWithLocation(
                `Invalid escape \\${ escapeChar }.`,
                {
                    line: token.loc.start.line,
                    column: token.loc.start.column + escapeIndex,
                    offset: token.loc.start.offset + escapeIndex
                }
            );
        }

        // find the next escape sequence
        escapeIndex = value.indexOf("\\", lastIndex);
    }

    // get the last segment of the string value
    result += value.slice(lastIndex);

    return result;
}

/**
 * Gets the JavaScript value represented by a JSON token.
 * @param {Token} token The JSON token to get a value for.
 * @returns {*} A number, string, boolean, or `null`. 
 */
function getLiteralValue(token) {
    switch (token.type) {
    case "Boolean":
        return token.value === "true";
        
    case "Number":
        return Number(token.value);

    case "Null":
        return null;

    case "String":
        return getStringValue(token);
    }
}

//-----------------------------------------------------------------------------
// Main Function
//-----------------------------------------------------------------------------

/**
 * 
 * @param {string} text The text to parse.
 * @param {boolean} [options.tokens=false] Determines if tokens are returned in
 *      the AST. 
 * @param {boolean} [options.comments=false] Determines if comments are allowed
 *      in the JSON.
 * @param {boolean} [options.ranges=false] Determines if ranges will be returned
 *      in addition to `loc` properties.
 * @returns {Object} The AST representing the parsed JSON.
 * @throws {Error} When there is a parsing error. 
 */
function parse(text, options) {

    options = Object.freeze({
        ...DEFAULT_OPTIONS$1,
        ...options
    });

    const tokens = tokenize(text, {
        comments: !!options.comments,
        ranges: !!options.ranges
    });
    let tokenIndex = 0;

    function nextNoComments() {
        return tokens[tokenIndex++];
    }
    
    function nextSkipComments() {
        const nextToken = tokens[tokenIndex++];
        if (nextToken && nextToken.type.endsWith("Comment")) {
            return nextSkipComments();
        }

        return nextToken;

    }

    // determine correct way to evaluate tokens based on presence of comments
    const next = options.comments ? nextSkipComments : nextNoComments;

    function assertTokenValue(token, value) {
        if (!token || token.value !== value) {
            throw new UnexpectedToken(token);
        }
    }

    function assertTokenType(token, type) {
        if (!token || token.type !== type) {
            throw new UnexpectedToken(token);
        }
    }

    function createRange(start, end) {
        return options.ranges ? {
            range: [start.offset, end.offset]
        } : undefined;
    }

    function createLiteralNode(token) {
        const range = createRange(token.loc.start, token.loc.end);

        return {
            type: token.type,
            value: getLiteralValue(token),
            loc: {
                start: {
                    ...token.loc.start
                },
                end: {
                    ...token.loc.end
                }
            },
            ...range
        };
    }


    function parseProperty(token) {
        assertTokenType(token, "String");
        const name = createLiteralNode(token);

        token = next();
        assertTokenValue(token, ":");
        const value = parseValue();
        const range = createRange(name.loc.start, value.loc.end);

        return types.member(name, value, {
            loc: {
                start: {
                    ...name.loc.start
                },
                end: {
                    ...value.loc.end
                }
            },
            ...range
        });
    }

    function parseObject(firstToken) {

        // The first token must be a { or else it's an error
        assertTokenValue(firstToken, "{");

        const members = [];
        let token = next();

        if (token && token.value !== "}") {
            do {
    
                // add the value into the array
                members.push(parseProperty(token));
    
                token = next();
    
                if (token.value === ",") {
                    token = next();
                } else {
                    break;
                }
            } while (token);
        }

        assertTokenValue(token, "}");
        const range = createRange(firstToken.loc.start, token.loc.end);

        return types.object(members, {
            loc: {
                start: {
                    ...firstToken.loc.start
                },
                end: {
                    ...token.loc.end
                }
            },
            ...range
        });

    }

    function parseArray(firstToken) {

        // The first token must be a [ or else it's an error
        assertTokenValue(firstToken, "[");

        const elements = [];
        let token = next();
        
        if (token && token.value !== "]") {

            do {

              // add the value into the array
              elements.push(parseValue(token));

              token = next();
              
              if (token.value === ",") {
                  token = next();
              } else {
                  break;
              }
            } while (token);
        }

        assertTokenValue(token, "]");
        const range = createRange(firstToken.loc.start, token.loc.end);

        return types.array(elements, {
            type: "Array",
            elements,
            loc: {
                start: {
                    ...firstToken.loc.start
                },
                end: {
                    ...token.loc.end
                }
            },
            ...range
        });

    }



    function parseValue(token) {

        token = token || next();
        
        switch (token.type) {
        case "String":
        case "Boolean":
        case "Number":
        case "Null":
            return createLiteralNode(token);

        case "Punctuator":
            if (token.value === "{") {
                return parseObject(token);
            } else if (token.value === "[") {
                return parseArray(token);
            }
            /*falls through*/

        default:
            throw new UnexpectedToken(token);
        }

    }

    
    const docBody = parseValue();
    
    const unexpectedToken = next();
    if (unexpectedToken) {
        throw new UnexpectedToken(unexpectedToken);
    }
    
    
    const docParts = {
        loc: {
            start: {
                line: 1,
                column: 1,
                offset: 0
            },
            end: {
                ...docBody.loc.end
            }
        }
    };
    

    if (options.tokens) {
        docParts.tokens = tokens;
    }

    if (options.ranges) {
        docParts.range = createRange(docParts.loc.start, docParts.loc.end);
    }

    return types.document(docBody, docParts);

}

/**
 * @fileoverview Traversal approaches for Momoa JSON AST.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const childKeys = new Map([
    ["Document", ["body"]],
    ["Object", ["members"]],
    ["Member", ["name", "value"]],
    ["Array", ["elements"]],
    ["String", []],
    ["Number", []],
    ["Boolean", []],
    ["Null", []]
]);

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Determines if a given value is an object.
 * @param {*} value The value to check.
 * @returns {boolean} True if the value is an object, false if not. 
 */
function isObject(value) {
    return value && (typeof value === "object");
}

/**
 * Determines if a given value is an AST node.
 * @param {*} value The value to check.
 * @returns {boolean} True if the value is a node, false if not. 
 */
function isNode(value) {
    return isObject(value) && (typeof value.type === "string");
}

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Traverses an AST from the given node.
 * @param {Node} root The node to traverse from 
 * @param {Object} visitor An object with an `enter` and `exit` method. 
 */
function traverse(root, visitor) {

    /**
     * Recursively visits a node.
     * @param {Node} node The node to visit.
     * @param {Node} parent The parent of the node to visit.
     * @returns {void}
     */
    function visitNode(node, parent) {

        if (typeof visitor.enter === "function") {
            visitor.enter(node, parent);
        }

        for (const key of childKeys.get(node.type)) {
            const value = node[key];

            if (isObject(value)) {
                if (Array.isArray(value)) {
                    value.forEach(child => visitNode(child, node));
                } else if (isNode(value)) {
                    visitNode(value, node);
                }
            }
        }

        if (typeof visitor.exit === "function") {
            visitor.exit(node, parent);
        }
    }

    visitNode(root);
}

/**
 * Creates an iterator over the given AST.
 * @param {Node} root The root AST node to traverse. 
 * @param {Function} [filter] A filter function to determine which steps to
 *      return;
 * @returns {Iterator} An iterator over the AST.  
 */
function iterator(root, filter = () => true) {

    const traversal = [];

    traverse(root, {
        enter(node, parent) {
            traversal.push({ node, parent, phase: "enter" });
        },
        exit(node, parent) {
            traversal.push({ node, parent, phase: "exit" });
        }
    });

    return traversal.filter(filter).values();
}

/**
 * @fileoverview Evaluator for Momoa AST.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Evaluates a Momoa AST node into a JavaScript value.
 * @param {Node} node The node to interpet.
 * @returns {*} The JavaScript value for the node. 
 */
function evaluate(node) {
    switch (node.type) {
    case "String":
    case "Number":
    case "Boolean":
        return node.value;

    case "Null":
        return null;

    case "Array":
        return node.elements.map(evaluate);

    case "Object": {

        const object = {};

        node.members.forEach(member => {
            object[evaluate(member.name)] = evaluate(member.value);
        });    

        return object;
    }    

    case "Document":
        return evaluate(node.body);

    case "Property":
        throw new Error("Cannot evaluate object property outside of an object.");

    default:
        throw new Error(`Unknown node type ${ node.type }.`);
    }
}

/**
 * @fileoverview Printer for Momoa AST.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Converts a Momoa AST back into a JSON string.
 * @param {Node} node The node to print.
 * @param {int} [options.indent=0] The number of spaces to indent each line. If
 *      greater than 0, then newlines and indents will be added to output. 
 * @returns {string} The JSON representation of the AST.
 */
function print(node, { indent = 0 } = {}) {
    const value = evaluate(node);
    return JSON.stringify(value, null, indent);
}

/**
 * @fileoverview File defining the interface of the package.
 * @author Nicholas C. Zakas
 */

exports.evaluate = evaluate;
exports.iterator = iterator;
exports.parse = parse;
exports.print = print;
exports.tokenize = tokenize;
exports.traverse = traverse;
exports.types = types;


/***/ }),

/***/ 1092:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {



var _interopRequireDefault = __nccwpck_require__(2645);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.createErrorInstances = createErrorInstances;
exports["default"] = prettify;
exports.filterRedundantErrors = filterRedundantErrors;
exports.makeTree = makeTree;
var _defineProperty2 = _interopRequireDefault(__nccwpck_require__(5300));
var _toConsumableArray2 = _interopRequireDefault(__nccwpck_require__(1987));
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(8208));
var _utils = __nccwpck_require__(5812);
var _validationErrors = __nccwpck_require__(4471);
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
var JSON_POINTERS_REGEX = /\/[\w_-]+(\/\d+)?/g;

// Make a tree of errors from ajv errors array
function makeTree() {
  var ajvErrors = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var root = {
    children: {}
  };
  ajvErrors.forEach(function (ajvError) {
    var instancePath = typeof ajvError.instancePath !== 'undefined' ? ajvError.instancePath : ajvError.dataPath;

    // `dataPath === ''` is root
    var paths = instancePath === '' ? [''] : instancePath.match(JSON_POINTERS_REGEX);
    if (paths) {
      paths.reduce(function (obj, path, i) {
        obj.children[path] = obj.children[path] || {
          children: {},
          errors: []
        };
        if (i === paths.length - 1) {
          obj.children[path].errors.push(ajvError);
        }
        return obj.children[path];
      }, root);
    }
  });
  return root;
}
function filterRedundantErrors(root, parent, key) {
  var _root$errors;
  /**
   * If there is a `required` error then we can just skip everythig else.
   * And, also `required` should have more priority than `anyOf`. @see #8
   */
  (0, _utils.getErrors)(root).forEach(function (error) {
    if ((0, _utils.isRequiredError)(error)) {
      root.errors = [error];
      root.children = {};
    }
  });

  /**
   * If there is an `anyOf` error that means we have more meaningful errors
   * inside children. So we will just remove all errors from this level.
   *
   * If there are no children, then we don't delete the errors since we should
   * have at least one error to report.
   */
  if ((0, _utils.getErrors)(root).some(_utils.isAnyOfError)) {
    if (Object.keys(root.children).length > 0) {
      delete root.errors;
    }
  }

  /**
   * If all errors are `enum` and siblings have any error then we can safely
   * ignore the node.
   *
   * **CAUTION**
   * Need explicit `root.errors` check because `[].every(fn) === true`
   * https://en.wikipedia.org/wiki/Vacuous_truth#Vacuous_truths_in_mathematics
   */
  if (root !== null && root !== void 0 && (_root$errors = root.errors) !== null && _root$errors !== void 0 && _root$errors.length && (0, _utils.getErrors)(root).every(_utils.isEnumError)) {
    if ((0, _utils.getSiblings)(parent)(root)
    // Remove any reference which becomes `undefined` later
    .filter(_utils.notUndefined).some(_utils.getErrors)) {
      delete parent.children[key];
    }
  }
  Object.entries(root.children).forEach(function (_ref) {
    var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
      k = _ref2[0],
      child = _ref2[1];
    filterRedundantErrors(child, root, k);
  });
}
function createErrorInstances(root, options) {
  var errors = (0, _utils.getErrors)(root);
  if (errors.length && errors.every(_utils.isEnumError)) {
    var uniqueValues = new Set((0, _utils.concatAll)([])(errors.map(function (e) {
      return e.params.allowedValues;
    })));
    var allowedValues = (0, _toConsumableArray2["default"])(uniqueValues);
    var error = errors[0];
    return [new _validationErrors.EnumValidationError(_objectSpread(_objectSpread({}, error), {}, {
      params: {
        allowedValues: allowedValues
      }
    }), options)];
  }
  return (0, _utils.concatAll)(errors.reduce(function (ret, error) {
    switch (error.keyword) {
      case 'additionalProperties':
        return ret.concat(new _validationErrors.AdditionalPropValidationError(error, options));
      case 'pattern':
        return ret.concat(new _validationErrors.PatternValidationError(error, options));
      case 'required':
        return ret.concat(new _validationErrors.RequiredValidationError(error, options));
      case 'unevaluatedProperties':
        return ret.concat(new _validationErrors.UnevaluatedPropValidationError(error, options));
      default:
        return ret.concat(new _validationErrors.DefaultValidationError(error, options));
    }
  }, []))((0, _utils.getChildren)(root).map(function (child) {
    return createErrorInstances(child, options);
  }));
}
function prettify(ajvErrors, options) {
  var tree = makeTree(ajvErrors || []);
  filterRedundantErrors(tree);
  return createErrorInstances(tree, options);
}

/***/ }),

/***/ 3193:
/***/ ((module, exports, __nccwpck_require__) => {



var _interopRequireDefault = __nccwpck_require__(2645);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = betterAjvErrors;
var _momoa = __nccwpck_require__(5483);
var _helpers = _interopRequireDefault(__nccwpck_require__(1092));
function betterAjvErrors(schema, data, errors) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _options$colorize = options.colorize,
    colorize = _options$colorize === void 0 ? true : _options$colorize,
    _options$format = options.format,
    format = _options$format === void 0 ? 'cli' : _options$format,
    _options$indent = options.indent,
    indent = _options$indent === void 0 ? null : _options$indent,
    _options$json = options.json,
    json = _options$json === void 0 ? null : _options$json;
  var jsonRaw = json || JSON.stringify(data, null, indent);
  var jsonAst = (0, _momoa.parse)(jsonRaw);
  var customErrorToText = function customErrorToText(error) {
    return error.print().join('\n');
  };
  var customErrorToStructure = function customErrorToStructure(error) {
    return error.getError();
  };
  var customErrors = (0, _helpers["default"])(errors, {
    colorize: colorize,
    data: data,
    schema: schema,
    jsonAst: jsonAst,
    jsonRaw: jsonRaw
  });
  if (format === 'cli') {
    return customErrors.map(customErrorToText).join('\n\n');
  } else if (format === 'cli-array') {
    return customErrors.map(function (error) {
      return {
        message: customErrorToText(error)
      };
    });
  }
  return customErrors.map(customErrorToStructure);
}
module.exports = exports.default;

/***/ }),

/***/ 1857:
/***/ ((module, exports, __nccwpck_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = getDecoratedDataPath;
var _utils = __nccwpck_require__(9309);
function getTypeName(obj) {
  if (!obj || !obj.elements) {
    return '';
  }
  var type = obj.elements.filter(function (child) {
    var _child$name;
    return (child === null || child === void 0 || (_child$name = child.name) === null || _child$name === void 0 ? void 0 : _child$name.value) === 'type';
  });
  if (!type.length) {
    return '';
  }
  return type[0].value && ":".concat(type[0].value.value) || '';
}
function getDecoratedDataPath(jsonAst, dataPath) {
  var decoratedPath = '';
  (0, _utils.getPointers)(dataPath).reduce(function (obj, pointer) {
    switch (obj.type) {
      case 'Object':
        {
          decoratedPath += "/".concat(pointer);
          var filtered = obj.members.filter(function (child) {
            return child.name.value === pointer;
          });
          if (filtered.length !== 1) {
            throw new Error("Couldn't find property ".concat(pointer, " of ").concat(dataPath));
          }
          return filtered[0].value;
        }
      case 'Array':
        {
          decoratedPath += "/".concat(pointer).concat(getTypeName(obj.elements[pointer]));
          return obj.elements[pointer];
        }
      default:
        console.log(obj);
    }
  }, jsonAst.body);
  return decoratedPath;
}
module.exports = exports.default;

/***/ }),

/***/ 4985:
/***/ ((module, exports, __nccwpck_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = getMetaFromPath;
var _utils = __nccwpck_require__(9309);
function getMetaFromPath(jsonAst, dataPath, includeIdentifierLocation) {
  var pointers = (0, _utils.getPointers)(dataPath);
  var lastPointerIndex = pointers.length - 1;
  return pointers.reduce(function (obj, pointer, idx) {
    switch (obj.type) {
      case 'Object':
        {
          var filtered = obj.members.filter(function (child) {
            return child.name.value === pointer;
          });
          if (filtered.length !== 1) {
            throw new Error("Couldn't find property ".concat(pointer, " of ").concat(dataPath));
          }
          var _filtered$ = filtered[0],
            name = _filtered$.name,
            value = _filtered$.value;
          return includeIdentifierLocation && idx === lastPointerIndex ? name : value;
        }
      case 'Array':
        return obj.elements[pointer];
      default:
        console.log(obj);
    }
  }, jsonAst.body);
}
module.exports = exports.default;

/***/ }),

/***/ 6484:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {



var _interopRequireDefault = __nccwpck_require__(2645);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
Object.defineProperty(exports, "getDecoratedDataPath", ({
  enumerable: true,
  get: function get() {
    return _getDecoratedDataPath["default"];
  }
}));
Object.defineProperty(exports, "getMetaFromPath", ({
  enumerable: true,
  get: function get() {
    return _getMetaFromPath["default"];
  }
}));
var _getDecoratedDataPath = _interopRequireDefault(__nccwpck_require__(1857));
var _getMetaFromPath = _interopRequireDefault(__nccwpck_require__(4985));

/***/ }),

/***/ 9309:
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getPointers = void 0;
// TODO: Better error handling
var getPointers = exports.getPointers = function getPointers(dataPath) {
  var pointers = dataPath.split('/').slice(1);
  for (var index in pointers) {
    pointers[index] = pointers[index].split('~1').join('/').split('~0').join('~');
  }
  return pointers;
};

/***/ }),

/***/ 5812:
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.notUndefined = exports.isRequiredError = exports.isEnumError = exports.isAnyOfError = exports.getSiblings = exports.getErrors = exports.getChildren = exports.concatAll = void 0;
// Basic
var eq = function eq(x) {
  return function (y) {
    return x === y;
  };
};
var not = function not(fn) {
  return function (x) {
    return !fn(x);
  };
};
var getValues = function getValues(o) {
  return Object.values(o);
};
var notUndefined = exports.notUndefined = function notUndefined(x) {
  return x !== undefined;
};

// Error
var isXError = function isXError(x) {
  return function (error) {
    return error.keyword === x;
  };
};
var isRequiredError = exports.isRequiredError = isXError('required');
var isAnyOfError = exports.isAnyOfError = isXError('anyOf');
var isEnumError = exports.isEnumError = isXError('enum');
var getErrors = exports.getErrors = function getErrors(node) {
  return (node === null || node === void 0 ? void 0 : node.errors) || [];
};

// Node
var getChildren = exports.getChildren = function getChildren(node) {
  return node && getValues(node.children) || [];
};
var getSiblings = exports.getSiblings = function getSiblings(parent /*: Node */) {
  return function /*: $ReadOnlyArray<Node> */
  (node /*: Node */) {
    return getChildren(parent).filter(not(eq(node)));
  };
};
var concatAll = exports.concatAll = /* ::<T> */

function concatAll(xs /*: $ReadOnlyArray<T> */) {
  return function /* : $ReadOnlyArray<T> */
  (ys /* : $ReadOnlyArray<T> */) {
    return ys.reduce(function (zs, z) {
      return zs.concat(z);
    }, xs);
  };
};

/***/ }),

/***/ 14:
/***/ ((module, exports, __nccwpck_require__) => {



var _interopRequireDefault = __nccwpck_require__(2645);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _defineProperty2 = _interopRequireDefault(__nccwpck_require__(5300));
var _classCallCheck2 = _interopRequireDefault(__nccwpck_require__(7450));
var _createClass2 = _interopRequireDefault(__nccwpck_require__(1916));
var _possibleConstructorReturn2 = _interopRequireDefault(__nccwpck_require__(1315));
var _getPrototypeOf2 = _interopRequireDefault(__nccwpck_require__(153));
var _inherits2 = _interopRequireDefault(__nccwpck_require__(5802));
var _base = _interopRequireDefault(__nccwpck_require__(6330));
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2["default"])(o), (0, _possibleConstructorReturn2["default"])(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2["default"])(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
var AdditionalPropValidationError = exports["default"] = /*#__PURE__*/function (_BaseValidationError) {
  function AdditionalPropValidationError() {
    var _this;
    (0, _classCallCheck2["default"])(this, AdditionalPropValidationError);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, AdditionalPropValidationError, [].concat(args));
    _this.name = 'AdditionalPropValidationError';
    _this.options.isIdentifierLocation = true;
    return _this;
  }
  (0, _inherits2["default"])(AdditionalPropValidationError, _BaseValidationError);
  return (0, _createClass2["default"])(AdditionalPropValidationError, [{
    key: "print",
    value: function print() {
      var _this$options = this.options,
        message = _this$options.message,
        params = _this$options.params;
      var colorizer = this.getColorizer();
      var output = ["".concat(colorizer.red("".concat(colorizer.bold('ADDITIONAL PROPERTY'), " ").concat(message)), "\n")];
      return output.concat(this.getCodeFrame("".concat(colorizer.magentaBright(params.additionalProperty), " is not expected to be here!"), "".concat(this.instancePath, "/").concat(params.additionalProperty)));
    }
  }, {
    key: "getError",
    value: function getError() {
      var params = this.options.params;
      return _objectSpread(_objectSpread({}, this.getLocation("".concat(this.instancePath, "/").concat(params.additionalProperty))), {}, {
        error: "".concat(this.getDecoratedPath(), " Property ").concat(params.additionalProperty, " is not expected to be here"),
        path: this.instancePath
      });
    }
  }]);
}(_base["default"]);
module.exports = exports.default;

/***/ }),

/***/ 6330:
/***/ ((module, exports, __nccwpck_require__) => {



var _interopRequireDefault = __nccwpck_require__(2645);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _classCallCheck2 = _interopRequireDefault(__nccwpck_require__(7450));
var _createClass2 = _interopRequireDefault(__nccwpck_require__(1916));
var _codeFrame = __nccwpck_require__(147);
var _picocolors = _interopRequireDefault(__nccwpck_require__(4955));
var _json = __nccwpck_require__(6484);
var BaseValidationError = exports["default"] = /*#__PURE__*/function () {
  function BaseValidationError() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      isIdentifierLocation: false
    };
    var _ref = arguments.length > 1 ? arguments[1] : undefined,
      colorize = _ref.colorize,
      data = _ref.data,
      schema = _ref.schema,
      jsonAst = _ref.jsonAst,
      jsonRaw = _ref.jsonRaw;
    (0, _classCallCheck2["default"])(this, BaseValidationError);
    this.options = options;
    this.colorize = !!(!!colorize || colorize === undefined);
    this.data = data;
    this.schema = schema;
    this.jsonAst = jsonAst;
    this.jsonRaw = jsonRaw;
  }
  return (0, _createClass2["default"])(BaseValidationError, [{
    key: "getColorizer",
    value: function getColorizer() {
      return this.colorize ? _picocolors["default"] :
      // `picocolors` doesn't have a way to programatically disable the library so we're
      // creating an empty proxy that'll just return the arguments of any color functions we
      // invoke, sans any colorization.
      new Proxy({}, {
        get: function get() {
          return function (arg) {
            return arg;
          };
        }
      });
    }
  }, {
    key: "getLocation",
    value: function getLocation() {
      var dataPath = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.instancePath;
      var _this$options = this.options,
        isIdentifierLocation = _this$options.isIdentifierLocation,
        isSkipEndLocation = _this$options.isSkipEndLocation;
      var _getMetaFromPath = (0, _json.getMetaFromPath)(this.jsonAst, dataPath, isIdentifierLocation),
        loc = _getMetaFromPath.loc;
      return {
        start: loc.start,
        end: isSkipEndLocation ? undefined : loc.end
      };
    }
  }, {
    key: "getDecoratedPath",
    value: function getDecoratedPath() {
      var dataPath = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.instancePath;
      return (0, _json.getDecoratedDataPath)(this.jsonAst, dataPath);
    }
  }, {
    key: "getCodeFrame",
    value: function getCodeFrame(message) {
      var dataPath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.instancePath;
      return (0, _codeFrame.codeFrameColumns)(this.jsonRaw, this.getLocation(dataPath), {
        /**
         * `@babel/highlight`, by way of `@babel/code-frame`, highlights out entire block of raw JSON
         * instead of just our `location` block -- so if you have a block of raw JSON that's upwards
         * of 2mb+ and have a lot of errors to generate code frames for then we're re-highlighting
         * the same huge chunk of code over and over and over and over again, all just so
         * `@babel/code-frame` will eventually extract a small <10 line chunk out of it to return to
         * us.
         *
         * Disabling `highlightCode` here will only disable highlighting the code we're showing users;
         * if `options.colorize` is supplied to this library then the error message we're adding will
         * still be highlighted.
         */
        highlightCode: false,
        message: message
      });
    }

    /**
     * @return {string}
     */
  }, {
    key: "instancePath",
    get: function get() {
      return typeof this.options.instancePath !== 'undefined' ? this.options.instancePath : this.options.dataPath;
    }
  }, {
    key: "print",
    value: function print() {
      throw new Error("Implement the 'print' method inside ".concat(this.constructor.name, "!"));
    }
  }, {
    key: "getError",
    value: function getError() {
      throw new Error("Implement the 'getError' method inside ".concat(this.constructor.name, "!"));
    }
  }]);
}();
module.exports = exports.default;

/***/ }),

/***/ 450:
/***/ ((module, exports, __nccwpck_require__) => {



var _interopRequireDefault = __nccwpck_require__(2645);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _defineProperty2 = _interopRequireDefault(__nccwpck_require__(5300));
var _classCallCheck2 = _interopRequireDefault(__nccwpck_require__(7450));
var _createClass2 = _interopRequireDefault(__nccwpck_require__(1916));
var _possibleConstructorReturn2 = _interopRequireDefault(__nccwpck_require__(1315));
var _getPrototypeOf2 = _interopRequireDefault(__nccwpck_require__(153));
var _inherits2 = _interopRequireDefault(__nccwpck_require__(5802));
var _base = _interopRequireDefault(__nccwpck_require__(6330));
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2["default"])(o), (0, _possibleConstructorReturn2["default"])(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2["default"])(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
var DefaultValidationError = exports["default"] = /*#__PURE__*/function (_BaseValidationError) {
  function DefaultValidationError() {
    var _this;
    (0, _classCallCheck2["default"])(this, DefaultValidationError);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, DefaultValidationError, [].concat(args));
    _this.name = 'DefaultValidationError';
    _this.options.isSkipEndLocation = true;
    return _this;
  }
  (0, _inherits2["default"])(DefaultValidationError, _BaseValidationError);
  return (0, _createClass2["default"])(DefaultValidationError, [{
    key: "print",
    value: function print() {
      var _this$options = this.options,
        keyword = _this$options.keyword,
        message = _this$options.message;
      var colorizer = this.getColorizer();
      var output = ["".concat(colorizer.red("".concat(colorizer.bold(keyword.toUpperCase()), " ").concat(message)), "\n")];
      return output.concat(this.getCodeFrame("".concat(colorizer.magentaBright(keyword), " ").concat(message)));
    }
  }, {
    key: "getError",
    value: function getError() {
      var _this$options2 = this.options,
        keyword = _this$options2.keyword,
        message = _this$options2.message;
      return _objectSpread(_objectSpread({}, this.getLocation()), {}, {
        error: "".concat(this.getDecoratedPath(), ": ").concat(keyword, " ").concat(message),
        path: this.instancePath
      });
    }
  }]);
}(_base["default"]);
module.exports = exports.default;

/***/ }),

/***/ 1282:
/***/ ((module, exports, __nccwpck_require__) => {



var _interopRequireDefault = __nccwpck_require__(2645);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _defineProperty2 = _interopRequireDefault(__nccwpck_require__(5300));
var _classCallCheck2 = _interopRequireDefault(__nccwpck_require__(7450));
var _createClass2 = _interopRequireDefault(__nccwpck_require__(1916));
var _possibleConstructorReturn2 = _interopRequireDefault(__nccwpck_require__(1315));
var _getPrototypeOf2 = _interopRequireDefault(__nccwpck_require__(153));
var _inherits2 = _interopRequireDefault(__nccwpck_require__(5802));
var _jsonpointer = _interopRequireDefault(__nccwpck_require__(3976));
var _leven = _interopRequireDefault(__nccwpck_require__(1444));
var _base = _interopRequireDefault(__nccwpck_require__(6330));
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2["default"])(o), (0, _possibleConstructorReturn2["default"])(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2["default"])(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
var EnumValidationError = exports["default"] = /*#__PURE__*/function (_BaseValidationError) {
  function EnumValidationError() {
    var _this;
    (0, _classCallCheck2["default"])(this, EnumValidationError);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, EnumValidationError, [].concat(args));
    _this.name = 'EnumValidationError';
    return _this;
  }
  (0, _inherits2["default"])(EnumValidationError, _BaseValidationError);
  return (0, _createClass2["default"])(EnumValidationError, [{
    key: "print",
    value: function print() {
      var _this$options = this.options,
        message = _this$options.message,
        allowedValues = _this$options.params.allowedValues;
      var colorizer = this.getColorizer();
      var bestMatch = this.findBestMatch();
      var output = ["".concat(colorizer.red("".concat(colorizer.bold('ENUM'), " ").concat(message))), "".concat(colorizer.red("(".concat(allowedValues.join(', '), ")")), "\n")];
      return output.concat(this.getCodeFrame(bestMatch !== null ? "Did you mean ".concat(colorizer.magentaBright(bestMatch), " here?") : 'Unexpected value, should be equal to one of the allowed values'));
    }
  }, {
    key: "getError",
    value: function getError() {
      var _this$options2 = this.options,
        message = _this$options2.message,
        params = _this$options2.params;
      var bestMatch = this.findBestMatch();
      var allowedValues = params.allowedValues.join(', ');
      var output = _objectSpread(_objectSpread({}, this.getLocation()), {}, {
        error: "".concat(this.getDecoratedPath(), " ").concat(message, ": ").concat(allowedValues),
        path: this.instancePath
      });
      if (bestMatch !== null) {
        output.suggestion = "Did you mean ".concat(bestMatch, "?");
      }
      return output;
    }
  }, {
    key: "findBestMatch",
    value: function findBestMatch() {
      var allowedValues = this.options.params.allowedValues;
      var currentValue = this.instancePath === '' ? this.data : _jsonpointer["default"].get(this.data, this.instancePath);
      if (!currentValue) {
        return null;
      }
      var bestMatch = allowedValues.map(function (value) {
        return {
          value: value,
          weight: (0, _leven["default"])(value, currentValue.toString())
        };
      }).sort(function (x, y) {
        return x.weight > y.weight ? 1 : x.weight < y.weight ? -1 : 0;
      })[0];
      return allowedValues.length === 1 || bestMatch.weight < bestMatch.value.length ? bestMatch.value : null;
    }
  }]);
}(_base["default"]);
module.exports = exports.default;

/***/ }),

/***/ 4471:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {



var _interopRequireDefault = __nccwpck_require__(2645);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
Object.defineProperty(exports, "AdditionalPropValidationError", ({
  enumerable: true,
  get: function get() {
    return _additionalProp["default"];
  }
}));
Object.defineProperty(exports, "DefaultValidationError", ({
  enumerable: true,
  get: function get() {
    return _default["default"];
  }
}));
Object.defineProperty(exports, "EnumValidationError", ({
  enumerable: true,
  get: function get() {
    return _enum["default"];
  }
}));
Object.defineProperty(exports, "PatternValidationError", ({
  enumerable: true,
  get: function get() {
    return _pattern["default"];
  }
}));
Object.defineProperty(exports, "RequiredValidationError", ({
  enumerable: true,
  get: function get() {
    return _required["default"];
  }
}));
Object.defineProperty(exports, "UnevaluatedPropValidationError", ({
  enumerable: true,
  get: function get() {
    return _unevaluatedProp["default"];
  }
}));
var _additionalProp = _interopRequireDefault(__nccwpck_require__(14));
var _default = _interopRequireDefault(__nccwpck_require__(450));
var _enum = _interopRequireDefault(__nccwpck_require__(1282));
var _pattern = _interopRequireDefault(__nccwpck_require__(1201));
var _required = _interopRequireDefault(__nccwpck_require__(5558));
var _unevaluatedProp = _interopRequireDefault(__nccwpck_require__(6961));

/***/ }),

/***/ 1201:
/***/ ((module, exports, __nccwpck_require__) => {



var _interopRequireDefault = __nccwpck_require__(2645);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _defineProperty2 = _interopRequireDefault(__nccwpck_require__(5300));
var _classCallCheck2 = _interopRequireDefault(__nccwpck_require__(7450));
var _createClass2 = _interopRequireDefault(__nccwpck_require__(1916));
var _possibleConstructorReturn2 = _interopRequireDefault(__nccwpck_require__(1315));
var _getPrototypeOf2 = _interopRequireDefault(__nccwpck_require__(153));
var _inherits2 = _interopRequireDefault(__nccwpck_require__(5802));
var _base = _interopRequireDefault(__nccwpck_require__(6330));
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2["default"])(o), (0, _possibleConstructorReturn2["default"])(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2["default"])(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
var PatternValidationError = exports["default"] = /*#__PURE__*/function (_BaseValidationError) {
  function PatternValidationError() {
    var _this;
    (0, _classCallCheck2["default"])(this, PatternValidationError);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, PatternValidationError, [].concat(args));
    _this.name = 'PatternValidationError';
    _this.options.isIdentifierLocation = true;
    return _this;
  }
  (0, _inherits2["default"])(PatternValidationError, _BaseValidationError);
  return (0, _createClass2["default"])(PatternValidationError, [{
    key: "print",
    value: function print() {
      var _this$options = this.options,
        message = _this$options.message,
        params = _this$options.params,
        propertyName = _this$options.propertyName;
      var colorizer = this.getColorizer();
      var output = ["".concat(colorizer.red("".concat(colorizer.bold('PROPERTY'), " ").concat(message)), "\n")];
      return output.concat(this.getCodeFrame("must match pattern ".concat(colorizer.magentaBright(params.pattern)), propertyName ? "".concat(this.instancePath, "/").concat(propertyName) : this.instancePath));
    }
  }, {
    key: "getError",
    value: function getError() {
      var _this$options2 = this.options,
        params = _this$options2.params,
        propertyName = _this$options2.propertyName;
      return _objectSpread(_objectSpread({}, this.getLocation()), {}, {
        error: "".concat(this.getDecoratedPath(), " Property \"").concat(propertyName, "\" must match pattern ").concat(params.pattern),
        path: this.instancePath
      });
    }
  }]);
}(_base["default"]);
module.exports = exports.default;

/***/ }),

/***/ 5558:
/***/ ((module, exports, __nccwpck_require__) => {



var _interopRequireDefault = __nccwpck_require__(2645);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _defineProperty2 = _interopRequireDefault(__nccwpck_require__(5300));
var _classCallCheck2 = _interopRequireDefault(__nccwpck_require__(7450));
var _createClass2 = _interopRequireDefault(__nccwpck_require__(1916));
var _possibleConstructorReturn2 = _interopRequireDefault(__nccwpck_require__(1315));
var _getPrototypeOf2 = _interopRequireDefault(__nccwpck_require__(153));
var _get2 = _interopRequireDefault(__nccwpck_require__(996));
var _inherits2 = _interopRequireDefault(__nccwpck_require__(5802));
var _base = _interopRequireDefault(__nccwpck_require__(6330));
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2["default"])(o), (0, _possibleConstructorReturn2["default"])(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2["default"])(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _superPropGet(t, o, e, r) { var p = (0, _get2["default"])((0, _getPrototypeOf2["default"])(1 & r ? t.prototype : t), o, e); return 2 & r && "function" == typeof p ? function (t) { return p.apply(e, t); } : p; }
var RequiredValidationError = exports["default"] = /*#__PURE__*/function (_BaseValidationError) {
  function RequiredValidationError() {
    var _this;
    (0, _classCallCheck2["default"])(this, RequiredValidationError);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, RequiredValidationError, [].concat(args));
    _this.name = 'RequiredValidationError';
    return _this;
  }
  (0, _inherits2["default"])(RequiredValidationError, _BaseValidationError);
  return (0, _createClass2["default"])(RequiredValidationError, [{
    key: "getLocation",
    value: function getLocation() {
      var dataPath = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.instancePath;
      var _superPropGet2 = _superPropGet(RequiredValidationError, "getLocation", this, 3)([dataPath]),
        start = _superPropGet2.start;
      return {
        start: start
      };
    }
  }, {
    key: "print",
    value: function print() {
      var _this$options = this.options,
        message = _this$options.message,
        params = _this$options.params;
      var colorizer = this.getColorizer();
      var output = ["".concat(colorizer.red("".concat(colorizer.bold('REQUIRED'), " ").concat(message)), "\n")];
      return output.concat(this.getCodeFrame("".concat(colorizer.magentaBright(params.missingProperty), " is missing here!")));
    }
  }, {
    key: "getError",
    value: function getError() {
      var message = this.options.message;
      return _objectSpread(_objectSpread({}, this.getLocation()), {}, {
        error: "".concat(this.getDecoratedPath(), " ").concat(message),
        path: this.instancePath
      });
    }
  }]);
}(_base["default"]);
module.exports = exports.default;

/***/ }),

/***/ 6961:
/***/ ((module, exports, __nccwpck_require__) => {



var _interopRequireDefault = __nccwpck_require__(2645);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _defineProperty2 = _interopRequireDefault(__nccwpck_require__(5300));
var _classCallCheck2 = _interopRequireDefault(__nccwpck_require__(7450));
var _createClass2 = _interopRequireDefault(__nccwpck_require__(1916));
var _possibleConstructorReturn2 = _interopRequireDefault(__nccwpck_require__(1315));
var _getPrototypeOf2 = _interopRequireDefault(__nccwpck_require__(153));
var _inherits2 = _interopRequireDefault(__nccwpck_require__(5802));
var _base = _interopRequireDefault(__nccwpck_require__(6330));
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2["default"])(o), (0, _possibleConstructorReturn2["default"])(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2["default"])(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
var UnevaluatedPropValidationError = exports["default"] = /*#__PURE__*/function (_BaseValidationError) {
  function UnevaluatedPropValidationError() {
    var _this;
    (0, _classCallCheck2["default"])(this, UnevaluatedPropValidationError);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, UnevaluatedPropValidationError, [].concat(args));
    _this.name = 'UnevaluatedPropValidationError';
    _this.options.isIdentifierLocation = true;
    return _this;
  }
  (0, _inherits2["default"])(UnevaluatedPropValidationError, _BaseValidationError);
  return (0, _createClass2["default"])(UnevaluatedPropValidationError, [{
    key: "print",
    value: function print() {
      var _this$options = this.options,
        message = _this$options.message,
        params = _this$options.params;
      var colorizer = this.getColorizer();
      var output = ["".concat(colorizer.red("".concat(colorizer.bold('UNEVALUATED PROPERTY'), " ").concat(message)), "\n")];
      return output.concat(this.getCodeFrame("".concat(colorizer.magentaBright(params.unevaluatedProperty), " is not expected to be here!"), "".concat(this.instancePath, "/").concat(params.unevaluatedProperty)));
    }
  }, {
    key: "getError",
    value: function getError() {
      var params = this.options.params;
      return _objectSpread(_objectSpread({}, this.getLocation("".concat(this.instancePath, "/").concat(params.unevaluatedProperty))), {}, {
        error: "".concat(this.getDecoratedPath(), " Property ").concat(params.unevaluatedProperty, " is not expected to be here"),
        path: this.instancePath
      });
    }
  }]);
}(_base["default"]);
module.exports = exports.default;

/***/ }),

/***/ 905:
/***/ ((module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = void 0;
const core_1 = __nccwpck_require__(3893);
const draft4_1 = __nccwpck_require__(3309);
const discriminator_1 = __nccwpck_require__(8886);
const draft4MetaSchema = __nccwpck_require__(6337);
const META_SUPPORT_DATA = ["/properties"];
const META_SCHEMA_ID = "http://json-schema.org/draft-04/schema";
class Ajv extends core_1.default {
    constructor(opts = {}) {
        super({
            ...opts,
            schemaId: "id",
        });
    }
    _addVocabularies() {
        super._addVocabularies();
        draft4_1.default.forEach((v) => this.addVocabulary(v));
        if (this.opts.discriminator)
            this.addKeyword(discriminator_1.default);
    }
    _addDefaultMetaSchema() {
        super._addDefaultMetaSchema();
        if (!this.opts.meta)
            return;
        const metaSchema = this.opts.$data
            ? this.$dataMetaSchema(draft4MetaSchema, META_SUPPORT_DATA)
            : draft4MetaSchema;
        this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
        this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
    }
    defaultMeta() {
        return (this.opts.defaultMeta =
            super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined));
    }
}
module.exports = exports = Ajv;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports["default"] = Ajv;
var core_2 = __nccwpck_require__(3893);
Object.defineProperty(exports, "KeywordCxt", ({ enumerable: true, get: function () { return core_2.KeywordCxt; } }));
var core_3 = __nccwpck_require__(3893);
Object.defineProperty(exports, "_", ({ enumerable: true, get: function () { return core_3._; } }));
Object.defineProperty(exports, "str", ({ enumerable: true, get: function () { return core_3.str; } }));
Object.defineProperty(exports, "stringify", ({ enumerable: true, get: function () { return core_3.stringify; } }));
Object.defineProperty(exports, "nil", ({ enumerable: true, get: function () { return core_3.nil; } }));
Object.defineProperty(exports, "Name", ({ enumerable: true, get: function () { return core_3.Name; } }));
Object.defineProperty(exports, "CodeGen", ({ enumerable: true, get: function () { return core_3.CodeGen; } }));
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 7243:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const ref_1 = __nccwpck_require__(2996);
const core = [
    "$schema",
    "id",
    "$defs",
    { keyword: "$comment" },
    "definitions",
    ref_1.default,
];
exports["default"] = core;
//# sourceMappingURL=core.js.map

/***/ }),

/***/ 3309:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __nccwpck_require__(7243);
const validation_1 = __nccwpck_require__(4376);
const applicator_1 = __nccwpck_require__(8775);
const format_1 = __nccwpck_require__(2601);
const metadataVocabulary = ["title", "description", "default"];
const draft4Vocabularies = [
    core_1.default,
    validation_1.default,
    applicator_1.default(),
    format_1.default,
    metadataVocabulary,
];
exports["default"] = draft4Vocabularies;
//# sourceMappingURL=draft4.js.map

/***/ }),

/***/ 4376:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const limitNumber_1 = __nccwpck_require__(4430);
const limitNumberExclusive_1 = __nccwpck_require__(8600);
const multipleOf_1 = __nccwpck_require__(8132);
const limitLength_1 = __nccwpck_require__(6962);
const pattern_1 = __nccwpck_require__(6023);
const limitProperties_1 = __nccwpck_require__(895);
const required_1 = __nccwpck_require__(4504);
const limitItems_1 = __nccwpck_require__(6296);
const uniqueItems_1 = __nccwpck_require__(5132);
const const_1 = __nccwpck_require__(8026);
const enum_1 = __nccwpck_require__(3200);
const validation = [
    // number
    limitNumber_1.default,
    limitNumberExclusive_1.default,
    multipleOf_1.default,
    // string
    limitLength_1.default,
    pattern_1.default,
    // object
    limitProperties_1.default,
    required_1.default,
    // array
    limitItems_1.default,
    uniqueItems_1.default,
    // any
    { keyword: "type", schemaType: ["string", "array"] },
    { keyword: "nullable", schemaType: "boolean" },
    const_1.default,
    enum_1.default,
];
exports["default"] = validation;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 4430:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __nccwpck_require__(3893);
const codegen_1 = __nccwpck_require__(1436);
const ops = codegen_1.operators;
const KWDs = {
    maximum: {
        exclusive: "exclusiveMaximum",
        ops: [
            { okStr: "<=", ok: ops.LTE, fail: ops.GT },
            { okStr: "<", ok: ops.LT, fail: ops.GTE },
        ],
    },
    minimum: {
        exclusive: "exclusiveMinimum",
        ops: [
            { okStr: ">=", ok: ops.GTE, fail: ops.LT },
            { okStr: ">", ok: ops.GT, fail: ops.LTE },
        ],
    },
};
const error = {
    message: (cxt) => core_1.str `must be ${kwdOp(cxt).okStr} ${cxt.schemaCode}`,
    params: (cxt) => core_1._ `{comparison: ${kwdOp(cxt).okStr}, limit: ${cxt.schemaCode}}`,
};
const def = {
    keyword: Object.keys(KWDs),
    type: "number",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
        const { data, schemaCode } = cxt;
        cxt.fail$data(core_1._ `${data} ${kwdOp(cxt).fail} ${schemaCode} || isNaN(${data})`);
    },
};
function kwdOp(cxt) {
    var _a;
    const keyword = cxt.keyword;
    const opsIdx = ((_a = cxt.parentSchema) === null || _a === void 0 ? void 0 : _a[KWDs[keyword].exclusive]) ? 1 : 0;
    return KWDs[keyword].ops[opsIdx];
}
exports["default"] = def;
//# sourceMappingURL=limitNumber.js.map

/***/ }),

/***/ 8600:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const KWDs = {
    exclusiveMaximum: "maximum",
    exclusiveMinimum: "minimum",
};
const def = {
    keyword: Object.keys(KWDs),
    type: "number",
    schemaType: "boolean",
    code({ keyword, parentSchema }) {
        const limitKwd = KWDs[keyword];
        if (parentSchema[limitKwd] === undefined) {
            throw new Error(`${keyword} can only be used with ${limitKwd}`);
        }
    },
};
exports["default"] = def;
//# sourceMappingURL=limitNumberExclusive.js.map

/***/ }),

/***/ 2210:
/***/ ((module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv2020 = void 0;
const core_1 = __nccwpck_require__(3893);
const draft2020_1 = __nccwpck_require__(4298);
const discriminator_1 = __nccwpck_require__(8886);
const json_schema_2020_12_1 = __nccwpck_require__(3995);
const META_SCHEMA_ID = "https://json-schema.org/draft/2020-12/schema";
class Ajv2020 extends core_1.default {
    constructor(opts = {}) {
        super({
            ...opts,
            dynamicRef: true,
            next: true,
            unevaluated: true,
        });
    }
    _addVocabularies() {
        super._addVocabularies();
        draft2020_1.default.forEach((v) => this.addVocabulary(v));
        if (this.opts.discriminator)
            this.addKeyword(discriminator_1.default);
    }
    _addDefaultMetaSchema() {
        super._addDefaultMetaSchema();
        const { $data, meta } = this.opts;
        if (!meta)
            return;
        json_schema_2020_12_1.default.call(this, $data);
        this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
    }
    defaultMeta() {
        return (this.opts.defaultMeta =
            super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined));
    }
}
exports.Ajv2020 = Ajv2020;
module.exports = exports = Ajv2020;
module.exports.Ajv2020 = Ajv2020;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports["default"] = Ajv2020;
var validate_1 = __nccwpck_require__(7881);
Object.defineProperty(exports, "KeywordCxt", ({ enumerable: true, get: function () { return validate_1.KeywordCxt; } }));
var codegen_1 = __nccwpck_require__(1436);
Object.defineProperty(exports, "_", ({ enumerable: true, get: function () { return codegen_1._; } }));
Object.defineProperty(exports, "str", ({ enumerable: true, get: function () { return codegen_1.str; } }));
Object.defineProperty(exports, "stringify", ({ enumerable: true, get: function () { return codegen_1.stringify; } }));
Object.defineProperty(exports, "nil", ({ enumerable: true, get: function () { return codegen_1.nil; } }));
Object.defineProperty(exports, "Name", ({ enumerable: true, get: function () { return codegen_1.Name; } }));
Object.defineProperty(exports, "CodeGen", ({ enumerable: true, get: function () { return codegen_1.CodeGen; } }));
var validation_error_1 = __nccwpck_require__(3021);
Object.defineProperty(exports, "ValidationError", ({ enumerable: true, get: function () { return validation_error_1.default; } }));
var ref_error_1 = __nccwpck_require__(3162);
Object.defineProperty(exports, "MissingRefError", ({ enumerable: true, get: function () { return ref_error_1.default; } }));
//# sourceMappingURL=2020.js.map

/***/ }),

/***/ 567:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.regexpCode = exports.getEsmExportName = exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = void 0;
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class _CodeOrName {
}
exports._CodeOrName = _CodeOrName;
exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
class Name extends _CodeOrName {
    constructor(s) {
        super();
        if (!exports.IDENTIFIER.test(s))
            throw new Error("CodeGen: name must be a valid identifier");
        this.str = s;
    }
    toString() {
        return this.str;
    }
    emptyStr() {
        return false;
    }
    get names() {
        return { [this.str]: 1 };
    }
}
exports.Name = Name;
class _Code extends _CodeOrName {
    constructor(code) {
        super();
        this._items = typeof code === "string" ? [code] : code;
    }
    toString() {
        return this.str;
    }
    emptyStr() {
        if (this._items.length > 1)
            return false;
        const item = this._items[0];
        return item === "" || item === '""';
    }
    get str() {
        var _a;
        return ((_a = this._str) !== null && _a !== void 0 ? _a : (this._str = this._items.reduce((s, c) => `${s}${c}`, "")));
    }
    get names() {
        var _a;
        return ((_a = this._names) !== null && _a !== void 0 ? _a : (this._names = this._items.reduce((names, c) => {
            if (c instanceof Name)
                names[c.str] = (names[c.str] || 0) + 1;
            return names;
        }, {})));
    }
}
exports._Code = _Code;
exports.nil = new _Code("");
function _(strs, ...args) {
    const code = [strs[0]];
    let i = 0;
    while (i < args.length) {
        addCodeArg(code, args[i]);
        code.push(strs[++i]);
    }
    return new _Code(code);
}
exports._ = _;
const plus = new _Code("+");
function str(strs, ...args) {
    const expr = [safeStringify(strs[0])];
    let i = 0;
    while (i < args.length) {
        expr.push(plus);
        addCodeArg(expr, args[i]);
        expr.push(plus, safeStringify(strs[++i]));
    }
    optimize(expr);
    return new _Code(expr);
}
exports.str = str;
function addCodeArg(code, arg) {
    if (arg instanceof _Code)
        code.push(...arg._items);
    else if (arg instanceof Name)
        code.push(arg);
    else
        code.push(interpolate(arg));
}
exports.addCodeArg = addCodeArg;
function optimize(expr) {
    let i = 1;
    while (i < expr.length - 1) {
        if (expr[i] === plus) {
            const res = mergeExprItems(expr[i - 1], expr[i + 1]);
            if (res !== undefined) {
                expr.splice(i - 1, 3, res);
                continue;
            }
            expr[i++] = "+";
        }
        i++;
    }
}
function mergeExprItems(a, b) {
    if (b === '""')
        return a;
    if (a === '""')
        return b;
    if (typeof a == "string") {
        if (b instanceof Name || a[a.length - 1] !== '"')
            return;
        if (typeof b != "string")
            return `${a.slice(0, -1)}${b}"`;
        if (b[0] === '"')
            return a.slice(0, -1) + b.slice(1);
        return;
    }
    if (typeof b == "string" && b[0] === '"' && !(a instanceof Name))
        return `"${a}${b.slice(1)}`;
    return;
}
function strConcat(c1, c2) {
    return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str `${c1}${c2}`;
}
exports.strConcat = strConcat;
// TODO do not allow arrays here
function interpolate(x) {
    return typeof x == "number" || typeof x == "boolean" || x === null
        ? x
        : safeStringify(Array.isArray(x) ? x.join(",") : x);
}
function stringify(x) {
    return new _Code(safeStringify(x));
}
exports.stringify = stringify;
function safeStringify(x) {
    return JSON.stringify(x)
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
}
exports.safeStringify = safeStringify;
function getProperty(key) {
    return typeof key == "string" && exports.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _ `[${key}]`;
}
exports.getProperty = getProperty;
//Does best effort to format the name properly
function getEsmExportName(key) {
    if (typeof key == "string" && exports.IDENTIFIER.test(key)) {
        return new _Code(`${key}`);
    }
    throw new Error(`CodeGen: invalid export name: ${key}, use explicit $id name mapping`);
}
exports.getEsmExportName = getEsmExportName;
function regexpCode(rx) {
    return new _Code(rx.toString());
}
exports.regexpCode = regexpCode;
//# sourceMappingURL=code.js.map

/***/ }),

/***/ 1436:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.regexpCode = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = void 0;
const code_1 = __nccwpck_require__(567);
const scope_1 = __nccwpck_require__(7788);
var code_2 = __nccwpck_require__(567);
Object.defineProperty(exports, "_", ({ enumerable: true, get: function () { return code_2._; } }));
Object.defineProperty(exports, "str", ({ enumerable: true, get: function () { return code_2.str; } }));
Object.defineProperty(exports, "strConcat", ({ enumerable: true, get: function () { return code_2.strConcat; } }));
Object.defineProperty(exports, "nil", ({ enumerable: true, get: function () { return code_2.nil; } }));
Object.defineProperty(exports, "getProperty", ({ enumerable: true, get: function () { return code_2.getProperty; } }));
Object.defineProperty(exports, "stringify", ({ enumerable: true, get: function () { return code_2.stringify; } }));
Object.defineProperty(exports, "regexpCode", ({ enumerable: true, get: function () { return code_2.regexpCode; } }));
Object.defineProperty(exports, "Name", ({ enumerable: true, get: function () { return code_2.Name; } }));
var scope_2 = __nccwpck_require__(7788);
Object.defineProperty(exports, "Scope", ({ enumerable: true, get: function () { return scope_2.Scope; } }));
Object.defineProperty(exports, "ValueScope", ({ enumerable: true, get: function () { return scope_2.ValueScope; } }));
Object.defineProperty(exports, "ValueScopeName", ({ enumerable: true, get: function () { return scope_2.ValueScopeName; } }));
Object.defineProperty(exports, "varKinds", ({ enumerable: true, get: function () { return scope_2.varKinds; } }));
exports.operators = {
    GT: new code_1._Code(">"),
    GTE: new code_1._Code(">="),
    LT: new code_1._Code("<"),
    LTE: new code_1._Code("<="),
    EQ: new code_1._Code("==="),
    NEQ: new code_1._Code("!=="),
    NOT: new code_1._Code("!"),
    OR: new code_1._Code("||"),
    AND: new code_1._Code("&&"),
    ADD: new code_1._Code("+"),
};
class Node {
    optimizeNodes() {
        return this;
    }
    optimizeNames(_names, _constants) {
        return this;
    }
}
class Def extends Node {
    constructor(varKind, name, rhs) {
        super();
        this.varKind = varKind;
        this.name = name;
        this.rhs = rhs;
    }
    render({ es5, _n }) {
        const varKind = es5 ? scope_1.varKinds.var : this.varKind;
        const rhs = this.rhs === undefined ? "" : ` = ${this.rhs}`;
        return `${varKind} ${this.name}${rhs};` + _n;
    }
    optimizeNames(names, constants) {
        if (!names[this.name.str])
            return;
        if (this.rhs)
            this.rhs = optimizeExpr(this.rhs, names, constants);
        return this;
    }
    get names() {
        return this.rhs instanceof code_1._CodeOrName ? this.rhs.names : {};
    }
}
class Assign extends Node {
    constructor(lhs, rhs, sideEffects) {
        super();
        this.lhs = lhs;
        this.rhs = rhs;
        this.sideEffects = sideEffects;
    }
    render({ _n }) {
        return `${this.lhs} = ${this.rhs};` + _n;
    }
    optimizeNames(names, constants) {
        if (this.lhs instanceof code_1.Name && !names[this.lhs.str] && !this.sideEffects)
            return;
        this.rhs = optimizeExpr(this.rhs, names, constants);
        return this;
    }
    get names() {
        const names = this.lhs instanceof code_1.Name ? {} : { ...this.lhs.names };
        return addExprNames(names, this.rhs);
    }
}
class AssignOp extends Assign {
    constructor(lhs, op, rhs, sideEffects) {
        super(lhs, rhs, sideEffects);
        this.op = op;
    }
    render({ _n }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
    }
}
class Label extends Node {
    constructor(label) {
        super();
        this.label = label;
        this.names = {};
    }
    render({ _n }) {
        return `${this.label}:` + _n;
    }
}
class Break extends Node {
    constructor(label) {
        super();
        this.label = label;
        this.names = {};
    }
    render({ _n }) {
        const label = this.label ? ` ${this.label}` : "";
        return `break${label};` + _n;
    }
}
class Throw extends Node {
    constructor(error) {
        super();
        this.error = error;
    }
    render({ _n }) {
        return `throw ${this.error};` + _n;
    }
    get names() {
        return this.error.names;
    }
}
class AnyCode extends Node {
    constructor(code) {
        super();
        this.code = code;
    }
    render({ _n }) {
        return `${this.code};` + _n;
    }
    optimizeNodes() {
        return `${this.code}` ? this : undefined;
    }
    optimizeNames(names, constants) {
        this.code = optimizeExpr(this.code, names, constants);
        return this;
    }
    get names() {
        return this.code instanceof code_1._CodeOrName ? this.code.names : {};
    }
}
class ParentNode extends Node {
    constructor(nodes = []) {
        super();
        this.nodes = nodes;
    }
    render(opts) {
        return this.nodes.reduce((code, n) => code + n.render(opts), "");
    }
    optimizeNodes() {
        const { nodes } = this;
        let i = nodes.length;
        while (i--) {
            const n = nodes[i].optimizeNodes();
            if (Array.isArray(n))
                nodes.splice(i, 1, ...n);
            else if (n)
                nodes[i] = n;
            else
                nodes.splice(i, 1);
        }
        return nodes.length > 0 ? this : undefined;
    }
    optimizeNames(names, constants) {
        const { nodes } = this;
        let i = nodes.length;
        while (i--) {
            // iterating backwards improves 1-pass optimization
            const n = nodes[i];
            if (n.optimizeNames(names, constants))
                continue;
            subtractNames(names, n.names);
            nodes.splice(i, 1);
        }
        return nodes.length > 0 ? this : undefined;
    }
    get names() {
        return this.nodes.reduce((names, n) => addNames(names, n.names), {});
    }
}
class BlockNode extends ParentNode {
    render(opts) {
        return "{" + opts._n + super.render(opts) + "}" + opts._n;
    }
}
class Root extends ParentNode {
}
class Else extends BlockNode {
}
Else.kind = "else";
class If extends BlockNode {
    constructor(condition, nodes) {
        super(nodes);
        this.condition = condition;
    }
    render(opts) {
        let code = `if(${this.condition})` + super.render(opts);
        if (this.else)
            code += "else " + this.else.render(opts);
        return code;
    }
    optimizeNodes() {
        super.optimizeNodes();
        const cond = this.condition;
        if (cond === true)
            return this.nodes; // else is ignored here
        let e = this.else;
        if (e) {
            const ns = e.optimizeNodes();
            e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
        }
        if (e) {
            if (cond === false)
                return e instanceof If ? e : e.nodes;
            if (this.nodes.length)
                return this;
            return new If(not(cond), e instanceof If ? [e] : e.nodes);
        }
        if (cond === false || !this.nodes.length)
            return undefined;
        return this;
    }
    optimizeNames(names, constants) {
        var _a;
        this.else = (_a = this.else) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
        if (!(super.optimizeNames(names, constants) || this.else))
            return;
        this.condition = optimizeExpr(this.condition, names, constants);
        return this;
    }
    get names() {
        const names = super.names;
        addExprNames(names, this.condition);
        if (this.else)
            addNames(names, this.else.names);
        return names;
    }
}
If.kind = "if";
class For extends BlockNode {
}
For.kind = "for";
class ForLoop extends For {
    constructor(iteration) {
        super();
        this.iteration = iteration;
    }
    render(opts) {
        return `for(${this.iteration})` + super.render(opts);
    }
    optimizeNames(names, constants) {
        if (!super.optimizeNames(names, constants))
            return;
        this.iteration = optimizeExpr(this.iteration, names, constants);
        return this;
    }
    get names() {
        return addNames(super.names, this.iteration.names);
    }
}
class ForRange extends For {
    constructor(varKind, name, from, to) {
        super();
        this.varKind = varKind;
        this.name = name;
        this.from = from;
        this.to = to;
    }
    render(opts) {
        const varKind = opts.es5 ? scope_1.varKinds.var : this.varKind;
        const { name, from, to } = this;
        return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
    }
    get names() {
        const names = addExprNames(super.names, this.from);
        return addExprNames(names, this.to);
    }
}
class ForIter extends For {
    constructor(loop, varKind, name, iterable) {
        super();
        this.loop = loop;
        this.varKind = varKind;
        this.name = name;
        this.iterable = iterable;
    }
    render(opts) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
    }
    optimizeNames(names, constants) {
        if (!super.optimizeNames(names, constants))
            return;
        this.iterable = optimizeExpr(this.iterable, names, constants);
        return this;
    }
    get names() {
        return addNames(super.names, this.iterable.names);
    }
}
class Func extends BlockNode {
    constructor(name, args, async) {
        super();
        this.name = name;
        this.args = args;
        this.async = async;
    }
    render(opts) {
        const _async = this.async ? "async " : "";
        return `${_async}function ${this.name}(${this.args})` + super.render(opts);
    }
}
Func.kind = "func";
class Return extends ParentNode {
    render(opts) {
        return "return " + super.render(opts);
    }
}
Return.kind = "return";
class Try extends BlockNode {
    render(opts) {
        let code = "try" + super.render(opts);
        if (this.catch)
            code += this.catch.render(opts);
        if (this.finally)
            code += this.finally.render(opts);
        return code;
    }
    optimizeNodes() {
        var _a, _b;
        super.optimizeNodes();
        (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNodes();
        (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNodes();
        return this;
    }
    optimizeNames(names, constants) {
        var _a, _b;
        super.optimizeNames(names, constants);
        (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
        (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNames(names, constants);
        return this;
    }
    get names() {
        const names = super.names;
        if (this.catch)
            addNames(names, this.catch.names);
        if (this.finally)
            addNames(names, this.finally.names);
        return names;
    }
}
class Catch extends BlockNode {
    constructor(error) {
        super();
        this.error = error;
    }
    render(opts) {
        return `catch(${this.error})` + super.render(opts);
    }
}
Catch.kind = "catch";
class Finally extends BlockNode {
    render(opts) {
        return "finally" + super.render(opts);
    }
}
Finally.kind = "finally";
class CodeGen {
    constructor(extScope, opts = {}) {
        this._values = {};
        this._blockStarts = [];
        this._constants = {};
        this.opts = { ...opts, _n: opts.lines ? "\n" : "" };
        this._extScope = extScope;
        this._scope = new scope_1.Scope({ parent: extScope });
        this._nodes = [new Root()];
    }
    toString() {
        return this._root.render(this.opts);
    }
    // returns unique name in the internal scope
    name(prefix) {
        return this._scope.name(prefix);
    }
    // reserves unique name in the external scope
    scopeName(prefix) {
        return this._extScope.name(prefix);
    }
    // reserves unique name in the external scope and assigns value to it
    scopeValue(prefixOrName, value) {
        const name = this._extScope.value(prefixOrName, value);
        const vs = this._values[name.prefix] || (this._values[name.prefix] = new Set());
        vs.add(name);
        return name;
    }
    getScopeValue(prefix, keyOrRef) {
        return this._extScope.getValue(prefix, keyOrRef);
    }
    // return code that assigns values in the external scope to the names that are used internally
    // (same names that were returned by gen.scopeName or gen.scopeValue)
    scopeRefs(scopeName) {
        return this._extScope.scopeRefs(scopeName, this._values);
    }
    scopeCode() {
        return this._extScope.scopeCode(this._values);
    }
    _def(varKind, nameOrPrefix, rhs, constant) {
        const name = this._scope.toName(nameOrPrefix);
        if (rhs !== undefined && constant)
            this._constants[name.str] = rhs;
        this._leafNode(new Def(varKind, name, rhs));
        return name;
    }
    // `const` declaration (`var` in es5 mode)
    const(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
    }
    // `let` declaration with optional assignment (`var` in es5 mode)
    let(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
    }
    // `var` declaration with optional assignment
    var(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
    }
    // assignment code
    assign(lhs, rhs, sideEffects) {
        return this._leafNode(new Assign(lhs, rhs, sideEffects));
    }
    // `+=` code
    add(lhs, rhs) {
        return this._leafNode(new AssignOp(lhs, exports.operators.ADD, rhs));
    }
    // appends passed SafeExpr to code or executes Block
    code(c) {
        if (typeof c == "function")
            c();
        else if (c !== code_1.nil)
            this._leafNode(new AnyCode(c));
        return this;
    }
    // returns code for object literal for the passed argument list of key-value pairs
    object(...keyValues) {
        const code = ["{"];
        for (const [key, value] of keyValues) {
            if (code.length > 1)
                code.push(",");
            code.push(key);
            if (key !== value || this.opts.es5) {
                code.push(":");
                (0, code_1.addCodeArg)(code, value);
            }
        }
        code.push("}");
        return new code_1._Code(code);
    }
    // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
    if(condition, thenBody, elseBody) {
        this._blockNode(new If(condition));
        if (thenBody && elseBody) {
            this.code(thenBody).else().code(elseBody).endIf();
        }
        else if (thenBody) {
            this.code(thenBody).endIf();
        }
        else if (elseBody) {
            throw new Error('CodeGen: "else" body without "then" body');
        }
        return this;
    }
    // `else if` clause - invalid without `if` or after `else` clauses
    elseIf(condition) {
        return this._elseNode(new If(condition));
    }
    // `else` clause - only valid after `if` or `else if` clauses
    else() {
        return this._elseNode(new Else());
    }
    // end `if` statement (needed if gen.if was used only with condition)
    endIf() {
        return this._endBlockNode(If, Else);
    }
    _for(node, forBody) {
        this._blockNode(node);
        if (forBody)
            this.code(forBody).endFor();
        return this;
    }
    // a generic `for` clause (or statement if `forBody` is passed)
    for(iteration, forBody) {
        return this._for(new ForLoop(iteration), forBody);
    }
    // `for` statement for a range of values
    forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
        const name = this._scope.toName(nameOrPrefix);
        return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
    }
    // `for-of` statement (in es5 mode replace with a normal for loop)
    forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
        const name = this._scope.toName(nameOrPrefix);
        if (this.opts.es5) {
            const arr = iterable instanceof code_1.Name ? iterable : this.var("_arr", iterable);
            return this.forRange("_i", 0, (0, code_1._) `${arr}.length`, (i) => {
                this.var(name, (0, code_1._) `${arr}[${i}]`);
                forBody(name);
            });
        }
        return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
    }
    // `for-in` statement.
    // With option `ownProperties` replaced with a `for-of` loop for object keys
    forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
        if (this.opts.ownProperties) {
            return this.forOf(nameOrPrefix, (0, code_1._) `Object.keys(${obj})`, forBody);
        }
        const name = this._scope.toName(nameOrPrefix);
        return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
    }
    // end `for` loop
    endFor() {
        return this._endBlockNode(For);
    }
    // `label` statement
    label(label) {
        return this._leafNode(new Label(label));
    }
    // `break` statement
    break(label) {
        return this._leafNode(new Break(label));
    }
    // `return` statement
    return(value) {
        const node = new Return();
        this._blockNode(node);
        this.code(value);
        if (node.nodes.length !== 1)
            throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(Return);
    }
    // `try` statement
    try(tryBody, catchCode, finallyCode) {
        if (!catchCode && !finallyCode)
            throw new Error('CodeGen: "try" without "catch" and "finally"');
        const node = new Try();
        this._blockNode(node);
        this.code(tryBody);
        if (catchCode) {
            const error = this.name("e");
            this._currNode = node.catch = new Catch(error);
            catchCode(error);
        }
        if (finallyCode) {
            this._currNode = node.finally = new Finally();
            this.code(finallyCode);
        }
        return this._endBlockNode(Catch, Finally);
    }
    // `throw` statement
    throw(error) {
        return this._leafNode(new Throw(error));
    }
    // start self-balancing block
    block(body, nodeCount) {
        this._blockStarts.push(this._nodes.length);
        if (body)
            this.code(body).endBlock(nodeCount);
        return this;
    }
    // end the current self-balancing block
    endBlock(nodeCount) {
        const len = this._blockStarts.pop();
        if (len === undefined)
            throw new Error("CodeGen: not in self-balancing block");
        const toClose = this._nodes.length - len;
        if (toClose < 0 || (nodeCount !== undefined && toClose !== nodeCount)) {
            throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
        }
        this._nodes.length = len;
        return this;
    }
    // `function` heading (or definition if funcBody is passed)
    func(name, args = code_1.nil, async, funcBody) {
        this._blockNode(new Func(name, args, async));
        if (funcBody)
            this.code(funcBody).endFunc();
        return this;
    }
    // end function definition
    endFunc() {
        return this._endBlockNode(Func);
    }
    optimize(n = 1) {
        while (n-- > 0) {
            this._root.optimizeNodes();
            this._root.optimizeNames(this._root.names, this._constants);
        }
    }
    _leafNode(node) {
        this._currNode.nodes.push(node);
        return this;
    }
    _blockNode(node) {
        this._currNode.nodes.push(node);
        this._nodes.push(node);
    }
    _endBlockNode(N1, N2) {
        const n = this._currNode;
        if (n instanceof N1 || (N2 && n instanceof N2)) {
            this._nodes.pop();
            return this;
        }
        throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
    }
    _elseNode(node) {
        const n = this._currNode;
        if (!(n instanceof If)) {
            throw new Error('CodeGen: "else" without "if"');
        }
        this._currNode = n.else = node;
        return this;
    }
    get _root() {
        return this._nodes[0];
    }
    get _currNode() {
        const ns = this._nodes;
        return ns[ns.length - 1];
    }
    set _currNode(node) {
        const ns = this._nodes;
        ns[ns.length - 1] = node;
    }
}
exports.CodeGen = CodeGen;
function addNames(names, from) {
    for (const n in from)
        names[n] = (names[n] || 0) + (from[n] || 0);
    return names;
}
function addExprNames(names, from) {
    return from instanceof code_1._CodeOrName ? addNames(names, from.names) : names;
}
function optimizeExpr(expr, names, constants) {
    if (expr instanceof code_1.Name)
        return replaceName(expr);
    if (!canOptimize(expr))
        return expr;
    return new code_1._Code(expr._items.reduce((items, c) => {
        if (c instanceof code_1.Name)
            c = replaceName(c);
        if (c instanceof code_1._Code)
            items.push(...c._items);
        else
            items.push(c);
        return items;
    }, []));
    function replaceName(n) {
        const c = constants[n.str];
        if (c === undefined || names[n.str] !== 1)
            return n;
        delete names[n.str];
        return c;
    }
    function canOptimize(e) {
        return (e instanceof code_1._Code &&
            e._items.some((c) => c instanceof code_1.Name && names[c.str] === 1 && constants[c.str] !== undefined));
    }
}
function subtractNames(names, from) {
    for (const n in from)
        names[n] = (names[n] || 0) - (from[n] || 0);
}
function not(x) {
    return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_1._) `!${par(x)}`;
}
exports.not = not;
const andCode = mappend(exports.operators.AND);
// boolean AND (&&) expression with the passed arguments
function and(...args) {
    return args.reduce(andCode);
}
exports.and = and;
const orCode = mappend(exports.operators.OR);
// boolean OR (||) expression with the passed arguments
function or(...args) {
    return args.reduce(orCode);
}
exports.or = or;
function mappend(op) {
    return (x, y) => (x === code_1.nil ? y : y === code_1.nil ? x : (0, code_1._) `${par(x)} ${op} ${par(y)}`);
}
function par(x) {
    return x instanceof code_1.Name ? x : (0, code_1._) `(${x})`;
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 7788:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = exports.UsedValueState = void 0;
const code_1 = __nccwpck_require__(567);
class ValueError extends Error {
    constructor(name) {
        super(`CodeGen: "code" for ${name} not defined`);
        this.value = name.value;
    }
}
var UsedValueState;
(function (UsedValueState) {
    UsedValueState[UsedValueState["Started"] = 0] = "Started";
    UsedValueState[UsedValueState["Completed"] = 1] = "Completed";
})(UsedValueState || (exports.UsedValueState = UsedValueState = {}));
exports.varKinds = {
    const: new code_1.Name("const"),
    let: new code_1.Name("let"),
    var: new code_1.Name("var"),
};
class Scope {
    constructor({ prefixes, parent } = {}) {
        this._names = {};
        this._prefixes = prefixes;
        this._parent = parent;
    }
    toName(nameOrPrefix) {
        return nameOrPrefix instanceof code_1.Name ? nameOrPrefix : this.name(nameOrPrefix);
    }
    name(prefix) {
        return new code_1.Name(this._newName(prefix));
    }
    _newName(prefix) {
        const ng = this._names[prefix] || this._nameGroup(prefix);
        return `${prefix}${ng.index++}`;
    }
    _nameGroup(prefix) {
        var _a, _b;
        if (((_b = (_a = this._parent) === null || _a === void 0 ? void 0 : _a._prefixes) === null || _b === void 0 ? void 0 : _b.has(prefix)) || (this._prefixes && !this._prefixes.has(prefix))) {
            throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
        }
        return (this._names[prefix] = { prefix, index: 0 });
    }
}
exports.Scope = Scope;
class ValueScopeName extends code_1.Name {
    constructor(prefix, nameStr) {
        super(nameStr);
        this.prefix = prefix;
    }
    setValue(value, { property, itemIndex }) {
        this.value = value;
        this.scopePath = (0, code_1._) `.${new code_1.Name(property)}[${itemIndex}]`;
    }
}
exports.ValueScopeName = ValueScopeName;
const line = (0, code_1._) `\n`;
class ValueScope extends Scope {
    constructor(opts) {
        super(opts);
        this._values = {};
        this._scope = opts.scope;
        this.opts = { ...opts, _n: opts.lines ? line : code_1.nil };
    }
    get() {
        return this._scope;
    }
    name(prefix) {
        return new ValueScopeName(prefix, this._newName(prefix));
    }
    value(nameOrPrefix, value) {
        var _a;
        if (value.ref === undefined)
            throw new Error("CodeGen: ref must be passed in value");
        const name = this.toName(nameOrPrefix);
        const { prefix } = name;
        const valueKey = (_a = value.key) !== null && _a !== void 0 ? _a : value.ref;
        let vs = this._values[prefix];
        if (vs) {
            const _name = vs.get(valueKey);
            if (_name)
                return _name;
        }
        else {
            vs = this._values[prefix] = new Map();
        }
        vs.set(valueKey, name);
        const s = this._scope[prefix] || (this._scope[prefix] = []);
        const itemIndex = s.length;
        s[itemIndex] = value.ref;
        name.setValue(value, { property: prefix, itemIndex });
        return name;
    }
    getValue(prefix, keyOrRef) {
        const vs = this._values[prefix];
        if (!vs)
            return;
        return vs.get(keyOrRef);
    }
    scopeRefs(scopeName, values = this._values) {
        return this._reduceValues(values, (name) => {
            if (name.scopePath === undefined)
                throw new Error(`CodeGen: name "${name}" has no value`);
            return (0, code_1._) `${scopeName}${name.scopePath}`;
        });
    }
    scopeCode(values = this._values, usedValues, getCode) {
        return this._reduceValues(values, (name) => {
            if (name.value === undefined)
                throw new Error(`CodeGen: name "${name}" has no value`);
            return name.value.code;
        }, usedValues, getCode);
    }
    _reduceValues(values, valueCode, usedValues = {}, getCode) {
        let code = code_1.nil;
        for (const prefix in values) {
            const vs = values[prefix];
            if (!vs)
                continue;
            const nameSet = (usedValues[prefix] = usedValues[prefix] || new Map());
            vs.forEach((name) => {
                if (nameSet.has(name))
                    return;
                nameSet.set(name, UsedValueState.Started);
                let c = valueCode(name);
                if (c) {
                    const def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
                    code = (0, code_1._) `${code}${def} ${name} = ${c};${this.opts._n}`;
                }
                else if ((c = getCode === null || getCode === void 0 ? void 0 : getCode(name))) {
                    code = (0, code_1._) `${code}${c}${this.opts._n}`;
                }
                else {
                    throw new ValueError(name);
                }
                nameSet.set(name, UsedValueState.Completed);
            });
        }
        return code;
    }
}
exports.ValueScope = ValueScope;
//# sourceMappingURL=scope.js.map

/***/ }),

/***/ 1283:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = void 0;
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const names_1 = __nccwpck_require__(630);
exports.keywordError = {
    message: ({ keyword }) => (0, codegen_1.str) `must pass "${keyword}" keyword validation`,
};
exports.keyword$DataError = {
    message: ({ keyword, schemaType }) => schemaType
        ? (0, codegen_1.str) `"${keyword}" keyword must be ${schemaType} ($data)`
        : (0, codegen_1.str) `"${keyword}" keyword is invalid ($data)`,
};
function reportError(cxt, error = exports.keywordError, errorPaths, overrideAllErrors) {
    const { it } = cxt;
    const { gen, compositeRule, allErrors } = it;
    const errObj = errorObjectCode(cxt, error, errorPaths);
    if (overrideAllErrors !== null && overrideAllErrors !== void 0 ? overrideAllErrors : (compositeRule || allErrors)) {
        addError(gen, errObj);
    }
    else {
        returnErrors(it, (0, codegen_1._) `[${errObj}]`);
    }
}
exports.reportError = reportError;
function reportExtraError(cxt, error = exports.keywordError, errorPaths) {
    const { it } = cxt;
    const { gen, compositeRule, allErrors } = it;
    const errObj = errorObjectCode(cxt, error, errorPaths);
    addError(gen, errObj);
    if (!(compositeRule || allErrors)) {
        returnErrors(it, names_1.default.vErrors);
    }
}
exports.reportExtraError = reportExtraError;
function resetErrorsCount(gen, errsCount) {
    gen.assign(names_1.default.errors, errsCount);
    gen.if((0, codegen_1._) `${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_1._) `${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
}
exports.resetErrorsCount = resetErrorsCount;
function extendErrors({ gen, keyword, schemaValue, data, errsCount, it, }) {
    /* istanbul ignore if */
    if (errsCount === undefined)
        throw new Error("ajv implementation error");
    const err = gen.name("err");
    gen.forRange("i", errsCount, names_1.default.errors, (i) => {
        gen.const(err, (0, codegen_1._) `${names_1.default.vErrors}[${i}]`);
        gen.if((0, codegen_1._) `${err}.instancePath === undefined`, () => gen.assign((0, codegen_1._) `${err}.instancePath`, (0, codegen_1.strConcat)(names_1.default.instancePath, it.errorPath)));
        gen.assign((0, codegen_1._) `${err}.schemaPath`, (0, codegen_1.str) `${it.errSchemaPath}/${keyword}`);
        if (it.opts.verbose) {
            gen.assign((0, codegen_1._) `${err}.schema`, schemaValue);
            gen.assign((0, codegen_1._) `${err}.data`, data);
        }
    });
}
exports.extendErrors = extendErrors;
function addError(gen, errObj) {
    const err = gen.const("err", errObj);
    gen.if((0, codegen_1._) `${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, (0, codegen_1._) `[${err}]`), (0, codegen_1._) `${names_1.default.vErrors}.push(${err})`);
    gen.code((0, codegen_1._) `${names_1.default.errors}++`);
}
function returnErrors(it, errs) {
    const { gen, validateName, schemaEnv } = it;
    if (schemaEnv.$async) {
        gen.throw((0, codegen_1._) `new ${it.ValidationError}(${errs})`);
    }
    else {
        gen.assign((0, codegen_1._) `${validateName}.errors`, errs);
        gen.return(false);
    }
}
const E = {
    keyword: new codegen_1.Name("keyword"),
    schemaPath: new codegen_1.Name("schemaPath"), // also used in JTD errors
    params: new codegen_1.Name("params"),
    propertyName: new codegen_1.Name("propertyName"),
    message: new codegen_1.Name("message"),
    schema: new codegen_1.Name("schema"),
    parentSchema: new codegen_1.Name("parentSchema"),
};
function errorObjectCode(cxt, error, errorPaths) {
    const { createErrors } = cxt.it;
    if (createErrors === false)
        return (0, codegen_1._) `{}`;
    return errorObject(cxt, error, errorPaths);
}
function errorObject(cxt, error, errorPaths = {}) {
    const { gen, it } = cxt;
    const keyValues = [
        errorInstancePath(it, errorPaths),
        errorSchemaPath(cxt, errorPaths),
    ];
    extraErrorProps(cxt, error, keyValues);
    return gen.object(...keyValues);
}
function errorInstancePath({ errorPath }, { instancePath }) {
    const instPath = instancePath
        ? (0, codegen_1.str) `${errorPath}${(0, util_1.getErrorPath)(instancePath, util_1.Type.Str)}`
        : errorPath;
    return [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, instPath)];
}
function errorSchemaPath({ keyword, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
    let schPath = parentSchema ? errSchemaPath : (0, codegen_1.str) `${errSchemaPath}/${keyword}`;
    if (schemaPath) {
        schPath = (0, codegen_1.str) `${schPath}${(0, util_1.getErrorPath)(schemaPath, util_1.Type.Str)}`;
    }
    return [E.schemaPath, schPath];
}
function extraErrorProps(cxt, { params, message }, keyValues) {
    const { keyword, data, schemaValue, it } = cxt;
    const { opts, propertyName, topSchemaRef, schemaPath } = it;
    keyValues.push([E.keyword, keyword], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_1._) `{}`]);
    if (opts.messages) {
        keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]);
    }
    if (opts.verbose) {
        keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_1._) `${topSchemaRef}${schemaPath}`], [names_1.default.data, data]);
    }
    if (propertyName)
        keyValues.push([E.propertyName, propertyName]);
}
//# sourceMappingURL=errors.js.map

/***/ }),

/***/ 2718:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.resolveSchema = exports.getCompilingSchema = exports.resolveRef = exports.compileSchema = exports.SchemaEnv = void 0;
const codegen_1 = __nccwpck_require__(1436);
const validation_error_1 = __nccwpck_require__(3021);
const names_1 = __nccwpck_require__(630);
const resolve_1 = __nccwpck_require__(4090);
const util_1 = __nccwpck_require__(4464);
const validate_1 = __nccwpck_require__(7881);
class SchemaEnv {
    constructor(env) {
        var _a;
        this.refs = {};
        this.dynamicAnchors = {};
        let schema;
        if (typeof env.schema == "object")
            schema = env.schema;
        this.schema = env.schema;
        this.schemaId = env.schemaId;
        this.root = env.root || this;
        this.baseId = (_a = env.baseId) !== null && _a !== void 0 ? _a : (0, resolve_1.normalizeId)(schema === null || schema === void 0 ? void 0 : schema[env.schemaId || "$id"]);
        this.schemaPath = env.schemaPath;
        this.localRefs = env.localRefs;
        this.meta = env.meta;
        this.$async = schema === null || schema === void 0 ? void 0 : schema.$async;
        this.refs = {};
    }
}
exports.SchemaEnv = SchemaEnv;
// let codeSize = 0
// let nodeCount = 0
// Compiles schema in SchemaEnv
function compileSchema(sch) {
    // TODO refactor - remove compilations
    const _sch = getCompilingSchema.call(this, sch);
    if (_sch)
        return _sch;
    const rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId); // TODO if getFullPath removed 1 tests fails
    const { es5, lines } = this.opts.code;
    const { ownProperties } = this.opts;
    const gen = new codegen_1.CodeGen(this.scope, { es5, lines, ownProperties });
    let _ValidationError;
    if (sch.$async) {
        _ValidationError = gen.scopeValue("Error", {
            ref: validation_error_1.default,
            code: (0, codegen_1._) `require("ajv/dist/runtime/validation_error").default`,
        });
    }
    const validateName = gen.scopeName("validate");
    sch.validateName = validateName;
    const schemaCxt = {
        gen,
        allErrors: this.opts.allErrors,
        data: names_1.default.data,
        parentData: names_1.default.parentData,
        parentDataProperty: names_1.default.parentDataProperty,
        dataNames: [names_1.default.data],
        dataPathArr: [codegen_1.nil], // TODO can its length be used as dataLevel if nil is removed?
        dataLevel: 0,
        dataTypes: [],
        definedProperties: new Set(),
        topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true
            ? { ref: sch.schema, code: (0, codegen_1.stringify)(sch.schema) }
            : { ref: sch.schema }),
        validateName,
        ValidationError: _ValidationError,
        schema: sch.schema,
        schemaEnv: sch,
        rootId,
        baseId: sch.baseId || rootId,
        schemaPath: codegen_1.nil,
        errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
        errorPath: (0, codegen_1._) `""`,
        opts: this.opts,
        self: this,
    };
    let sourceCode;
    try {
        this._compilations.add(sch);
        (0, validate_1.validateFunctionCode)(schemaCxt);
        gen.optimize(this.opts.code.optimize);
        // gen.optimize(1)
        const validateCode = gen.toString();
        sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`;
        // console.log((codeSize += sourceCode.length), (nodeCount += gen.nodeCount))
        if (this.opts.code.process)
            sourceCode = this.opts.code.process(sourceCode, sch);
        // console.log("\n\n\n *** \n", sourceCode)
        const makeValidate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode);
        const validate = makeValidate(this, this.scope.get());
        this.scope.value(validateName, { ref: validate });
        validate.errors = null;
        validate.schema = sch.schema;
        validate.schemaEnv = sch;
        if (sch.$async)
            validate.$async = true;
        if (this.opts.code.source === true) {
            validate.source = { validateName, validateCode, scopeValues: gen._values };
        }
        if (this.opts.unevaluated) {
            const { props, items } = schemaCxt;
            validate.evaluated = {
                props: props instanceof codegen_1.Name ? undefined : props,
                items: items instanceof codegen_1.Name ? undefined : items,
                dynamicProps: props instanceof codegen_1.Name,
                dynamicItems: items instanceof codegen_1.Name,
            };
            if (validate.source)
                validate.source.evaluated = (0, codegen_1.stringify)(validate.evaluated);
        }
        sch.validate = validate;
        return sch;
    }
    catch (e) {
        delete sch.validate;
        delete sch.validateName;
        if (sourceCode)
            this.logger.error("Error compiling schema, function code:", sourceCode);
        // console.log("\n\n\n *** \n", sourceCode, this.opts)
        throw e;
    }
    finally {
        this._compilations.delete(sch);
    }
}
exports.compileSchema = compileSchema;
function resolveRef(root, baseId, ref) {
    var _a;
    ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref);
    const schOrFunc = root.refs[ref];
    if (schOrFunc)
        return schOrFunc;
    let _sch = resolve.call(this, root, ref);
    if (_sch === undefined) {
        const schema = (_a = root.localRefs) === null || _a === void 0 ? void 0 : _a[ref]; // TODO maybe localRefs should hold SchemaEnv
        const { schemaId } = this.opts;
        if (schema)
            _sch = new SchemaEnv({ schema, schemaId, root, baseId });
    }
    if (_sch === undefined)
        return;
    return (root.refs[ref] = inlineOrCompile.call(this, _sch));
}
exports.resolveRef = resolveRef;
function inlineOrCompile(sch) {
    if ((0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs))
        return sch.schema;
    return sch.validate ? sch : compileSchema.call(this, sch);
}
// Index of schema compilation in the currently compiled list
function getCompilingSchema(schEnv) {
    for (const sch of this._compilations) {
        if (sameSchemaEnv(sch, schEnv))
            return sch;
    }
}
exports.getCompilingSchema = getCompilingSchema;
function sameSchemaEnv(s1, s2) {
    return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
}
// resolve and compile the references ($ref)
// TODO returns AnySchemaObject (if the schema can be inlined) or validation function
function resolve(root, // information about the root schema for the current schema
ref // reference to resolve
) {
    let sch;
    while (typeof (sch = this.refs[ref]) == "string")
        ref = sch;
    return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
}
// Resolve schema, its root and baseId
function resolveSchema(root, // root object with properties schema, refs TODO below SchemaEnv is assigned to it
ref // reference to resolve
) {
    const p = this.opts.uriResolver.parse(ref);
    const refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p);
    let baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, undefined);
    // TODO `Object.keys(root.schema).length > 0` should not be needed - but removing breaks 2 tests
    if (Object.keys(root.schema).length > 0 && refPath === baseId) {
        return getJsonPointer.call(this, p, root);
    }
    const id = (0, resolve_1.normalizeId)(refPath);
    const schOrRef = this.refs[id] || this.schemas[id];
    if (typeof schOrRef == "string") {
        const sch = resolveSchema.call(this, root, schOrRef);
        if (typeof (sch === null || sch === void 0 ? void 0 : sch.schema) !== "object")
            return;
        return getJsonPointer.call(this, p, sch);
    }
    if (typeof (schOrRef === null || schOrRef === void 0 ? void 0 : schOrRef.schema) !== "object")
        return;
    if (!schOrRef.validate)
        compileSchema.call(this, schOrRef);
    if (id === (0, resolve_1.normalizeId)(ref)) {
        const { schema } = schOrRef;
        const { schemaId } = this.opts;
        const schId = schema[schemaId];
        if (schId)
            baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
        return new SchemaEnv({ schema, schemaId, root, baseId });
    }
    return getJsonPointer.call(this, p, schOrRef);
}
exports.resolveSchema = resolveSchema;
const PREVENT_SCOPE_CHANGE = new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions",
]);
function getJsonPointer(parsedRef, { baseId, schema, root }) {
    var _a;
    if (((_a = parsedRef.fragment) === null || _a === void 0 ? void 0 : _a[0]) !== "/")
        return;
    for (const part of parsedRef.fragment.slice(1).split("/")) {
        if (typeof schema === "boolean")
            return;
        const partSchema = schema[(0, util_1.unescapeFragment)(part)];
        if (partSchema === undefined)
            return;
        schema = partSchema;
        // TODO PREVENT_SCOPE_CHANGE could be defined in keyword def?
        const schId = typeof schema === "object" && schema[this.opts.schemaId];
        if (!PREVENT_SCOPE_CHANGE.has(part) && schId) {
            baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
        }
    }
    let env;
    if (typeof schema != "boolean" && schema.$ref && !(0, util_1.schemaHasRulesButRef)(schema, this.RULES)) {
        const $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema.$ref);
        env = resolveSchema.call(this, root, $ref);
    }
    // even though resolution failed we need to return SchemaEnv to throw exception
    // so that compileAsync loads missing schema.
    const { schemaId } = this.opts;
    env = env || new SchemaEnv({ schema, schemaId, root, baseId });
    if (env.schema !== env.root.schema)
        return env;
    return undefined;
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 630:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const names = {
    // validation function arguments
    data: new codegen_1.Name("data"), // data passed to validation function
    // args passed from referencing schema
    valCxt: new codegen_1.Name("valCxt"), // validation/data context - should not be used directly, it is destructured to the names below
    instancePath: new codegen_1.Name("instancePath"),
    parentData: new codegen_1.Name("parentData"),
    parentDataProperty: new codegen_1.Name("parentDataProperty"),
    rootData: new codegen_1.Name("rootData"), // root data - same as the data passed to the first/top validation function
    dynamicAnchors: new codegen_1.Name("dynamicAnchors"), // used to support recursiveRef and dynamicRef
    // function scoped variables
    vErrors: new codegen_1.Name("vErrors"), // null or array of validation errors
    errors: new codegen_1.Name("errors"), // counter of validation errors
    this: new codegen_1.Name("this"),
    // "globals"
    self: new codegen_1.Name("self"),
    scope: new codegen_1.Name("scope"),
    // JTD serialize/parse name for JSON string and position
    json: new codegen_1.Name("json"),
    jsonPos: new codegen_1.Name("jsonPos"),
    jsonLen: new codegen_1.Name("jsonLen"),
    jsonPart: new codegen_1.Name("jsonPart"),
};
exports["default"] = names;
//# sourceMappingURL=names.js.map

/***/ }),

/***/ 3162:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const resolve_1 = __nccwpck_require__(4090);
class MissingRefError extends Error {
    constructor(resolver, baseId, ref, msg) {
        super(msg || `can't resolve reference ${ref} from id ${baseId}`);
        this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref);
        this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, this.missingRef));
    }
}
exports["default"] = MissingRefError;
//# sourceMappingURL=ref_error.js.map

/***/ }),

/***/ 4090:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getSchemaRefs = exports.resolveUrl = exports.normalizeId = exports._getFullPath = exports.getFullPath = exports.inlineRef = void 0;
const util_1 = __nccwpck_require__(4464);
const equal = __nccwpck_require__(3430);
const traverse = __nccwpck_require__(1167);
// TODO refactor to use keyword definitions
const SIMPLE_INLINED = new Set([
    "type",
    "format",
    "pattern",
    "maxLength",
    "minLength",
    "maxProperties",
    "minProperties",
    "maxItems",
    "minItems",
    "maximum",
    "minimum",
    "uniqueItems",
    "multipleOf",
    "required",
    "enum",
    "const",
]);
function inlineRef(schema, limit = true) {
    if (typeof schema == "boolean")
        return true;
    if (limit === true)
        return !hasRef(schema);
    if (!limit)
        return false;
    return countKeys(schema) <= limit;
}
exports.inlineRef = inlineRef;
const REF_KEYWORDS = new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor",
]);
function hasRef(schema) {
    for (const key in schema) {
        if (REF_KEYWORDS.has(key))
            return true;
        const sch = schema[key];
        if (Array.isArray(sch) && sch.some(hasRef))
            return true;
        if (typeof sch == "object" && hasRef(sch))
            return true;
    }
    return false;
}
function countKeys(schema) {
    let count = 0;
    for (const key in schema) {
        if (key === "$ref")
            return Infinity;
        count++;
        if (SIMPLE_INLINED.has(key))
            continue;
        if (typeof schema[key] == "object") {
            (0, util_1.eachItem)(schema[key], (sch) => (count += countKeys(sch)));
        }
        if (count === Infinity)
            return Infinity;
    }
    return count;
}
function getFullPath(resolver, id = "", normalize) {
    if (normalize !== false)
        id = normalizeId(id);
    const p = resolver.parse(id);
    return _getFullPath(resolver, p);
}
exports.getFullPath = getFullPath;
function _getFullPath(resolver, p) {
    const serialized = resolver.serialize(p);
    return serialized.split("#")[0] + "#";
}
exports._getFullPath = _getFullPath;
const TRAILING_SLASH_HASH = /#\/?$/;
function normalizeId(id) {
    return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
}
exports.normalizeId = normalizeId;
function resolveUrl(resolver, baseId, id) {
    id = normalizeId(id);
    return resolver.resolve(baseId, id);
}
exports.resolveUrl = resolveUrl;
const ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
function getSchemaRefs(schema, baseId) {
    if (typeof schema == "boolean")
        return {};
    const { schemaId, uriResolver } = this.opts;
    const schId = normalizeId(schema[schemaId] || baseId);
    const baseIds = { "": schId };
    const pathPrefix = getFullPath(uriResolver, schId, false);
    const localRefs = {};
    const schemaRefs = new Set();
    traverse(schema, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
        if (parentJsonPtr === undefined)
            return;
        const fullPath = pathPrefix + jsonPtr;
        let innerBaseId = baseIds[parentJsonPtr];
        if (typeof sch[schemaId] == "string")
            innerBaseId = addRef.call(this, sch[schemaId]);
        addAnchor.call(this, sch.$anchor);
        addAnchor.call(this, sch.$dynamicAnchor);
        baseIds[jsonPtr] = innerBaseId;
        function addRef(ref) {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            const _resolve = this.opts.uriResolver.resolve;
            ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref);
            if (schemaRefs.has(ref))
                throw ambiguos(ref);
            schemaRefs.add(ref);
            let schOrRef = this.refs[ref];
            if (typeof schOrRef == "string")
                schOrRef = this.refs[schOrRef];
            if (typeof schOrRef == "object") {
                checkAmbiguosRef(sch, schOrRef.schema, ref);
            }
            else if (ref !== normalizeId(fullPath)) {
                if (ref[0] === "#") {
                    checkAmbiguosRef(sch, localRefs[ref], ref);
                    localRefs[ref] = sch;
                }
                else {
                    this.refs[ref] = fullPath;
                }
            }
            return ref;
        }
        function addAnchor(anchor) {
            if (typeof anchor == "string") {
                if (!ANCHOR.test(anchor))
                    throw new Error(`invalid anchor "${anchor}"`);
                addRef.call(this, `#${anchor}`);
            }
        }
    });
    return localRefs;
    function checkAmbiguosRef(sch1, sch2, ref) {
        if (sch2 !== undefined && !equal(sch1, sch2))
            throw ambiguos(ref);
    }
    function ambiguos(ref) {
        return new Error(`reference "${ref}" resolves to more than one schema`);
    }
}
exports.getSchemaRefs = getSchemaRefs;
//# sourceMappingURL=resolve.js.map

/***/ }),

/***/ 7353:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getRules = exports.isJSONType = void 0;
const _jsonTypes = ["string", "number", "integer", "boolean", "null", "object", "array"];
const jsonTypes = new Set(_jsonTypes);
function isJSONType(x) {
    return typeof x == "string" && jsonTypes.has(x);
}
exports.isJSONType = isJSONType;
function getRules() {
    const groups = {
        number: { type: "number", rules: [] },
        string: { type: "string", rules: [] },
        array: { type: "array", rules: [] },
        object: { type: "object", rules: [] },
    };
    return {
        types: { ...groups, integer: true, boolean: true, null: true },
        rules: [{ rules: [] }, groups.number, groups.string, groups.array, groups.object],
        post: { rules: [] },
        all: {},
        keywords: {},
    };
}
exports.getRules = getRules;
//# sourceMappingURL=rules.js.map

/***/ }),

/***/ 4464:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.checkStrictMode = exports.getErrorPath = exports.Type = exports.useFunc = exports.setEvaluated = exports.evaluatedPropsToName = exports.mergeEvaluated = exports.eachItem = exports.unescapeJsonPointer = exports.escapeJsonPointer = exports.escapeFragment = exports.unescapeFragment = exports.schemaRefOrVal = exports.schemaHasRulesButRef = exports.schemaHasRules = exports.checkUnknownRules = exports.alwaysValidSchema = exports.toHash = void 0;
const codegen_1 = __nccwpck_require__(1436);
const code_1 = __nccwpck_require__(567);
// TODO refactor to use Set
function toHash(arr) {
    const hash = {};
    for (const item of arr)
        hash[item] = true;
    return hash;
}
exports.toHash = toHash;
function alwaysValidSchema(it, schema) {
    if (typeof schema == "boolean")
        return schema;
    if (Object.keys(schema).length === 0)
        return true;
    checkUnknownRules(it, schema);
    return !schemaHasRules(schema, it.self.RULES.all);
}
exports.alwaysValidSchema = alwaysValidSchema;
function checkUnknownRules(it, schema = it.schema) {
    const { opts, self } = it;
    if (!opts.strictSchema)
        return;
    if (typeof schema === "boolean")
        return;
    const rules = self.RULES.keywords;
    for (const key in schema) {
        if (!rules[key])
            checkStrictMode(it, `unknown keyword: "${key}"`);
    }
}
exports.checkUnknownRules = checkUnknownRules;
function schemaHasRules(schema, rules) {
    if (typeof schema == "boolean")
        return !schema;
    for (const key in schema)
        if (rules[key])
            return true;
    return false;
}
exports.schemaHasRules = schemaHasRules;
function schemaHasRulesButRef(schema, RULES) {
    if (typeof schema == "boolean")
        return !schema;
    for (const key in schema)
        if (key !== "$ref" && RULES.all[key])
            return true;
    return false;
}
exports.schemaHasRulesButRef = schemaHasRulesButRef;
function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
    if (!$data) {
        if (typeof schema == "number" || typeof schema == "boolean")
            return schema;
        if (typeof schema == "string")
            return (0, codegen_1._) `${schema}`;
    }
    return (0, codegen_1._) `${topSchemaRef}${schemaPath}${(0, codegen_1.getProperty)(keyword)}`;
}
exports.schemaRefOrVal = schemaRefOrVal;
function unescapeFragment(str) {
    return unescapeJsonPointer(decodeURIComponent(str));
}
exports.unescapeFragment = unescapeFragment;
function escapeFragment(str) {
    return encodeURIComponent(escapeJsonPointer(str));
}
exports.escapeFragment = escapeFragment;
function escapeJsonPointer(str) {
    if (typeof str == "number")
        return `${str}`;
    return str.replace(/~/g, "~0").replace(/\//g, "~1");
}
exports.escapeJsonPointer = escapeJsonPointer;
function unescapeJsonPointer(str) {
    return str.replace(/~1/g, "/").replace(/~0/g, "~");
}
exports.unescapeJsonPointer = unescapeJsonPointer;
function eachItem(xs, f) {
    if (Array.isArray(xs)) {
        for (const x of xs)
            f(x);
    }
    else {
        f(xs);
    }
}
exports.eachItem = eachItem;
function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues, resultToName, }) {
    return (gen, from, to, toName) => {
        const res = to === undefined
            ? from
            : to instanceof codegen_1.Name
                ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to)
                : from instanceof codegen_1.Name
                    ? (mergeToName(gen, to, from), from)
                    : mergeValues(from, to);
        return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
    };
}
exports.mergeEvaluated = {
    props: makeMergeEvaluated({
        mergeNames: (gen, from, to) => gen.if((0, codegen_1._) `${to} !== true && ${from} !== undefined`, () => {
            gen.if((0, codegen_1._) `${from} === true`, () => gen.assign(to, true), () => gen.assign(to, (0, codegen_1._) `${to} || {}`).code((0, codegen_1._) `Object.assign(${to}, ${from})`));
        }),
        mergeToName: (gen, from, to) => gen.if((0, codegen_1._) `${to} !== true`, () => {
            if (from === true) {
                gen.assign(to, true);
            }
            else {
                gen.assign(to, (0, codegen_1._) `${to} || {}`);
                setEvaluated(gen, to, from);
            }
        }),
        mergeValues: (from, to) => (from === true ? true : { ...from, ...to }),
        resultToName: evaluatedPropsToName,
    }),
    items: makeMergeEvaluated({
        mergeNames: (gen, from, to) => gen.if((0, codegen_1._) `${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1._) `${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
        mergeToName: (gen, from, to) => gen.if((0, codegen_1._) `${to} !== true`, () => gen.assign(to, from === true ? true : (0, codegen_1._) `${to} > ${from} ? ${to} : ${from}`)),
        mergeValues: (from, to) => (from === true ? true : Math.max(from, to)),
        resultToName: (gen, items) => gen.var("items", items),
    }),
};
function evaluatedPropsToName(gen, ps) {
    if (ps === true)
        return gen.var("props", true);
    const props = gen.var("props", (0, codegen_1._) `{}`);
    if (ps !== undefined)
        setEvaluated(gen, props, ps);
    return props;
}
exports.evaluatedPropsToName = evaluatedPropsToName;
function setEvaluated(gen, props, ps) {
    Object.keys(ps).forEach((p) => gen.assign((0, codegen_1._) `${props}${(0, codegen_1.getProperty)(p)}`, true));
}
exports.setEvaluated = setEvaluated;
const snippets = {};
function useFunc(gen, f) {
    return gen.scopeValue("func", {
        ref: f,
        code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code)),
    });
}
exports.useFunc = useFunc;
var Type;
(function (Type) {
    Type[Type["Num"] = 0] = "Num";
    Type[Type["Str"] = 1] = "Str";
})(Type || (exports.Type = Type = {}));
function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
    // let path
    if (dataProp instanceof codegen_1.Name) {
        const isNumber = dataPropType === Type.Num;
        return jsPropertySyntax
            ? isNumber
                ? (0, codegen_1._) `"[" + ${dataProp} + "]"`
                : (0, codegen_1._) `"['" + ${dataProp} + "']"`
            : isNumber
                ? (0, codegen_1._) `"/" + ${dataProp}`
                : (0, codegen_1._) `"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`; // TODO maybe use global escapePointer
    }
    return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
}
exports.getErrorPath = getErrorPath;
function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
    if (!mode)
        return;
    msg = `strict mode: ${msg}`;
    if (mode === true)
        throw new Error(msg);
    it.self.logger.warn(msg);
}
exports.checkStrictMode = checkStrictMode;
//# sourceMappingURL=util.js.map

/***/ }),

/***/ 7692:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.shouldUseRule = exports.shouldUseGroup = exports.schemaHasRulesForType = void 0;
function schemaHasRulesForType({ schema, self }, type) {
    const group = self.RULES.types[type];
    return group && group !== true && shouldUseGroup(schema, group);
}
exports.schemaHasRulesForType = schemaHasRulesForType;
function shouldUseGroup(schema, group) {
    return group.rules.some((rule) => shouldUseRule(schema, rule));
}
exports.shouldUseGroup = shouldUseGroup;
function shouldUseRule(schema, rule) {
    var _a;
    return (schema[rule.keyword] !== undefined ||
        ((_a = rule.definition.implements) === null || _a === void 0 ? void 0 : _a.some((kwd) => schema[kwd] !== undefined)));
}
exports.shouldUseRule = shouldUseRule;
//# sourceMappingURL=applicability.js.map

/***/ }),

/***/ 5346:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.boolOrEmptySchema = exports.topBoolOrEmptySchema = void 0;
const errors_1 = __nccwpck_require__(1283);
const codegen_1 = __nccwpck_require__(1436);
const names_1 = __nccwpck_require__(630);
const boolError = {
    message: "boolean schema is false",
};
function topBoolOrEmptySchema(it) {
    const { gen, schema, validateName } = it;
    if (schema === false) {
        falseSchemaError(it, false);
    }
    else if (typeof schema == "object" && schema.$async === true) {
        gen.return(names_1.default.data);
    }
    else {
        gen.assign((0, codegen_1._) `${validateName}.errors`, null);
        gen.return(true);
    }
}
exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
function boolOrEmptySchema(it, valid) {
    const { gen, schema } = it;
    if (schema === false) {
        gen.var(valid, false); // TODO var
        falseSchemaError(it);
    }
    else {
        gen.var(valid, true); // TODO var
    }
}
exports.boolOrEmptySchema = boolOrEmptySchema;
function falseSchemaError(it, overrideAllErrors) {
    const { gen, data } = it;
    // TODO maybe some other interface should be used for non-keyword validation errors...
    const cxt = {
        gen,
        keyword: "false schema",
        data,
        schema: false,
        schemaCode: false,
        schemaValue: false,
        params: {},
        it,
    };
    (0, errors_1.reportError)(cxt, boolError, undefined, overrideAllErrors);
}
//# sourceMappingURL=boolSchema.js.map

/***/ }),

/***/ 6685:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.reportTypeError = exports.checkDataTypes = exports.checkDataType = exports.coerceAndCheckDataType = exports.getJSONTypes = exports.getSchemaTypes = exports.DataType = void 0;
const rules_1 = __nccwpck_require__(7353);
const applicability_1 = __nccwpck_require__(7692);
const errors_1 = __nccwpck_require__(1283);
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
var DataType;
(function (DataType) {
    DataType[DataType["Correct"] = 0] = "Correct";
    DataType[DataType["Wrong"] = 1] = "Wrong";
})(DataType || (exports.DataType = DataType = {}));
function getSchemaTypes(schema) {
    const types = getJSONTypes(schema.type);
    const hasNull = types.includes("null");
    if (hasNull) {
        if (schema.nullable === false)
            throw new Error("type: null contradicts nullable: false");
    }
    else {
        if (!types.length && schema.nullable !== undefined) {
            throw new Error('"nullable" cannot be used without "type"');
        }
        if (schema.nullable === true)
            types.push("null");
    }
    return types;
}
exports.getSchemaTypes = getSchemaTypes;
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
function getJSONTypes(ts) {
    const types = Array.isArray(ts) ? ts : ts ? [ts] : [];
    if (types.every(rules_1.isJSONType))
        return types;
    throw new Error("type must be JSONType or JSONType[]: " + types.join(","));
}
exports.getJSONTypes = getJSONTypes;
function coerceAndCheckDataType(it, types) {
    const { gen, data, opts } = it;
    const coerceTo = coerceToTypes(types, opts.coerceTypes);
    const checkTypes = types.length > 0 &&
        !(coerceTo.length === 0 && types.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types[0]));
    if (checkTypes) {
        const wrongType = checkDataTypes(types, data, opts.strictNumbers, DataType.Wrong);
        gen.if(wrongType, () => {
            if (coerceTo.length)
                coerceData(it, types, coerceTo);
            else
                reportTypeError(it);
        });
    }
    return checkTypes;
}
exports.coerceAndCheckDataType = coerceAndCheckDataType;
const COERCIBLE = new Set(["string", "number", "integer", "boolean", "null"]);
function coerceToTypes(types, coerceTypes) {
    return coerceTypes
        ? types.filter((t) => COERCIBLE.has(t) || (coerceTypes === "array" && t === "array"))
        : [];
}
function coerceData(it, types, coerceTo) {
    const { gen, data, opts } = it;
    const dataType = gen.let("dataType", (0, codegen_1._) `typeof ${data}`);
    const coerced = gen.let("coerced", (0, codegen_1._) `undefined`);
    if (opts.coerceTypes === "array") {
        gen.if((0, codegen_1._) `${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen
            .assign(data, (0, codegen_1._) `${data}[0]`)
            .assign(dataType, (0, codegen_1._) `typeof ${data}`)
            .if(checkDataTypes(types, data, opts.strictNumbers), () => gen.assign(coerced, data)));
    }
    gen.if((0, codegen_1._) `${coerced} !== undefined`);
    for (const t of coerceTo) {
        if (COERCIBLE.has(t) || (t === "array" && opts.coerceTypes === "array")) {
            coerceSpecificType(t);
        }
    }
    gen.else();
    reportTypeError(it);
    gen.endIf();
    gen.if((0, codegen_1._) `${coerced} !== undefined`, () => {
        gen.assign(data, coerced);
        assignParentData(it, coerced);
    });
    function coerceSpecificType(t) {
        switch (t) {
            case "string":
                gen
                    .elseIf((0, codegen_1._) `${dataType} == "number" || ${dataType} == "boolean"`)
                    .assign(coerced, (0, codegen_1._) `"" + ${data}`)
                    .elseIf((0, codegen_1._) `${data} === null`)
                    .assign(coerced, (0, codegen_1._) `""`);
                return;
            case "number":
                gen
                    .elseIf((0, codegen_1._) `${dataType} == "boolean" || ${data} === null
              || (${dataType} == "string" && ${data} && ${data} == +${data})`)
                    .assign(coerced, (0, codegen_1._) `+${data}`);
                return;
            case "integer":
                gen
                    .elseIf((0, codegen_1._) `${dataType} === "boolean" || ${data} === null
              || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`)
                    .assign(coerced, (0, codegen_1._) `+${data}`);
                return;
            case "boolean":
                gen
                    .elseIf((0, codegen_1._) `${data} === "false" || ${data} === 0 || ${data} === null`)
                    .assign(coerced, false)
                    .elseIf((0, codegen_1._) `${data} === "true" || ${data} === 1`)
                    .assign(coerced, true);
                return;
            case "null":
                gen.elseIf((0, codegen_1._) `${data} === "" || ${data} === 0 || ${data} === false`);
                gen.assign(coerced, null);
                return;
            case "array":
                gen
                    .elseIf((0, codegen_1._) `${dataType} === "string" || ${dataType} === "number"
              || ${dataType} === "boolean" || ${data} === null`)
                    .assign(coerced, (0, codegen_1._) `[${data}]`);
        }
    }
}
function assignParentData({ gen, parentData, parentDataProperty }, expr) {
    // TODO use gen.property
    gen.if((0, codegen_1._) `${parentData} !== undefined`, () => gen.assign((0, codegen_1._) `${parentData}[${parentDataProperty}]`, expr));
}
function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
    const EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ;
    let cond;
    switch (dataType) {
        case "null":
            return (0, codegen_1._) `${data} ${EQ} null`;
        case "array":
            cond = (0, codegen_1._) `Array.isArray(${data})`;
            break;
        case "object":
            cond = (0, codegen_1._) `${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
            break;
        case "integer":
            cond = numCond((0, codegen_1._) `!(${data} % 1) && !isNaN(${data})`);
            break;
        case "number":
            cond = numCond();
            break;
        default:
            return (0, codegen_1._) `typeof ${data} ${EQ} ${dataType}`;
    }
    return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
    function numCond(_cond = codegen_1.nil) {
        return (0, codegen_1.and)((0, codegen_1._) `typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1._) `isFinite(${data})` : codegen_1.nil);
    }
}
exports.checkDataType = checkDataType;
function checkDataTypes(dataTypes, data, strictNums, correct) {
    if (dataTypes.length === 1) {
        return checkDataType(dataTypes[0], data, strictNums, correct);
    }
    let cond;
    const types = (0, util_1.toHash)(dataTypes);
    if (types.array && types.object) {
        const notObj = (0, codegen_1._) `typeof ${data} != "object"`;
        cond = types.null ? notObj : (0, codegen_1._) `!${data} || ${notObj}`;
        delete types.null;
        delete types.array;
        delete types.object;
    }
    else {
        cond = codegen_1.nil;
    }
    if (types.number)
        delete types.integer;
    for (const t in types)
        cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
    return cond;
}
exports.checkDataTypes = checkDataTypes;
const typeError = {
    message: ({ schema }) => `must be ${schema}`,
    params: ({ schema, schemaValue }) => typeof schema == "string" ? (0, codegen_1._) `{type: ${schema}}` : (0, codegen_1._) `{type: ${schemaValue}}`,
};
function reportTypeError(it) {
    const cxt = getTypeErrorContext(it);
    (0, errors_1.reportError)(cxt, typeError);
}
exports.reportTypeError = reportTypeError;
function getTypeErrorContext(it) {
    const { gen, data, schema } = it;
    const schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
    return {
        gen,
        keyword: "type",
        data,
        schema: schema.type,
        schemaCode,
        schemaValue: schemaCode,
        parentSchema: schema,
        params: {},
        it,
    };
}
//# sourceMappingURL=dataType.js.map

/***/ }),

/***/ 1699:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.assignDefaults = void 0;
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
function assignDefaults(it, ty) {
    const { properties, items } = it.schema;
    if (ty === "object" && properties) {
        for (const key in properties) {
            assignDefault(it, key, properties[key].default);
        }
    }
    else if (ty === "array" && Array.isArray(items)) {
        items.forEach((sch, i) => assignDefault(it, i, sch.default));
    }
}
exports.assignDefaults = assignDefaults;
function assignDefault(it, prop, defaultValue) {
    const { gen, compositeRule, data, opts } = it;
    if (defaultValue === undefined)
        return;
    const childData = (0, codegen_1._) `${data}${(0, codegen_1.getProperty)(prop)}`;
    if (compositeRule) {
        (0, util_1.checkStrictMode)(it, `default is ignored for: ${childData}`);
        return;
    }
    let condition = (0, codegen_1._) `${childData} === undefined`;
    if (opts.useDefaults === "empty") {
        condition = (0, codegen_1._) `${condition} || ${childData} === null || ${childData} === ""`;
    }
    // `${childData} === undefined` +
    // (opts.useDefaults === "empty" ? ` || ${childData} === null || ${childData} === ""` : "")
    gen.if(condition, (0, codegen_1._) `${childData} = ${(0, codegen_1.stringify)(defaultValue)}`);
}
//# sourceMappingURL=defaults.js.map

/***/ }),

/***/ 7881:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getData = exports.KeywordCxt = exports.validateFunctionCode = void 0;
const boolSchema_1 = __nccwpck_require__(5346);
const dataType_1 = __nccwpck_require__(6685);
const applicability_1 = __nccwpck_require__(7692);
const dataType_2 = __nccwpck_require__(6685);
const defaults_1 = __nccwpck_require__(1699);
const keyword_1 = __nccwpck_require__(5202);
const subschema_1 = __nccwpck_require__(6200);
const codegen_1 = __nccwpck_require__(1436);
const names_1 = __nccwpck_require__(630);
const resolve_1 = __nccwpck_require__(4090);
const util_1 = __nccwpck_require__(4464);
const errors_1 = __nccwpck_require__(1283);
// schema compilation - generates validation function, subschemaCode (below) is used for subschemas
function validateFunctionCode(it) {
    if (isSchemaObj(it)) {
        checkKeywords(it);
        if (schemaCxtHasRules(it)) {
            topSchemaObjCode(it);
            return;
        }
    }
    validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
}
exports.validateFunctionCode = validateFunctionCode;
function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
    if (opts.code.es5) {
        gen.func(validateName, (0, codegen_1._) `${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
            gen.code((0, codegen_1._) `"use strict"; ${funcSourceUrl(schema, opts)}`);
            destructureValCxtES5(gen, opts);
            gen.code(body);
        });
    }
    else {
        gen.func(validateName, (0, codegen_1._) `${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
    }
}
function destructureValCxt(opts) {
    return (0, codegen_1._) `{${names_1.default.instancePath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? (0, codegen_1._) `, ${names_1.default.dynamicAnchors}={}` : codegen_1.nil}}={}`;
}
function destructureValCxtES5(gen, opts) {
    gen.if(names_1.default.valCxt, () => {
        gen.var(names_1.default.instancePath, (0, codegen_1._) `${names_1.default.valCxt}.${names_1.default.instancePath}`);
        gen.var(names_1.default.parentData, (0, codegen_1._) `${names_1.default.valCxt}.${names_1.default.parentData}`);
        gen.var(names_1.default.parentDataProperty, (0, codegen_1._) `${names_1.default.valCxt}.${names_1.default.parentDataProperty}`);
        gen.var(names_1.default.rootData, (0, codegen_1._) `${names_1.default.valCxt}.${names_1.default.rootData}`);
        if (opts.dynamicRef)
            gen.var(names_1.default.dynamicAnchors, (0, codegen_1._) `${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
    }, () => {
        gen.var(names_1.default.instancePath, (0, codegen_1._) `""`);
        gen.var(names_1.default.parentData, (0, codegen_1._) `undefined`);
        gen.var(names_1.default.parentDataProperty, (0, codegen_1._) `undefined`);
        gen.var(names_1.default.rootData, names_1.default.data);
        if (opts.dynamicRef)
            gen.var(names_1.default.dynamicAnchors, (0, codegen_1._) `{}`);
    });
}
function topSchemaObjCode(it) {
    const { schema, opts, gen } = it;
    validateFunction(it, () => {
        if (opts.$comment && schema.$comment)
            commentKeyword(it);
        checkNoDefault(it);
        gen.let(names_1.default.vErrors, null);
        gen.let(names_1.default.errors, 0);
        if (opts.unevaluated)
            resetEvaluated(it);
        typeAndKeywords(it);
        returnResults(it);
    });
    return;
}
function resetEvaluated(it) {
    // TODO maybe some hook to execute it in the end to check whether props/items are Name, as in assignEvaluated
    const { gen, validateName } = it;
    it.evaluated = gen.const("evaluated", (0, codegen_1._) `${validateName}.evaluated`);
    gen.if((0, codegen_1._) `${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1._) `${it.evaluated}.props`, (0, codegen_1._) `undefined`));
    gen.if((0, codegen_1._) `${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1._) `${it.evaluated}.items`, (0, codegen_1._) `undefined`));
}
function funcSourceUrl(schema, opts) {
    const schId = typeof schema == "object" && schema[opts.schemaId];
    return schId && (opts.code.source || opts.code.process) ? (0, codegen_1._) `/*# sourceURL=${schId} */` : codegen_1.nil;
}
// schema compilation - this function is used recursively to generate code for sub-schemas
function subschemaCode(it, valid) {
    if (isSchemaObj(it)) {
        checkKeywords(it);
        if (schemaCxtHasRules(it)) {
            subSchemaObjCode(it, valid);
            return;
        }
    }
    (0, boolSchema_1.boolOrEmptySchema)(it, valid);
}
function schemaCxtHasRules({ schema, self }) {
    if (typeof schema == "boolean")
        return !schema;
    for (const key in schema)
        if (self.RULES.all[key])
            return true;
    return false;
}
function isSchemaObj(it) {
    return typeof it.schema != "boolean";
}
function subSchemaObjCode(it, valid) {
    const { schema, gen, opts } = it;
    if (opts.$comment && schema.$comment)
        commentKeyword(it);
    updateContext(it);
    checkAsyncSchema(it);
    const errsCount = gen.const("_errs", names_1.default.errors);
    typeAndKeywords(it, errsCount);
    // TODO var
    gen.var(valid, (0, codegen_1._) `${errsCount} === ${names_1.default.errors}`);
}
function checkKeywords(it) {
    (0, util_1.checkUnknownRules)(it);
    checkRefsAndKeywords(it);
}
function typeAndKeywords(it, errsCount) {
    if (it.opts.jtd)
        return schemaKeywords(it, [], false, errsCount);
    const types = (0, dataType_1.getSchemaTypes)(it.schema);
    const checkedTypes = (0, dataType_1.coerceAndCheckDataType)(it, types);
    schemaKeywords(it, types, !checkedTypes, errsCount);
}
function checkRefsAndKeywords(it) {
    const { schema, errSchemaPath, opts, self } = it;
    if (schema.$ref && opts.ignoreKeywordsWithRef && (0, util_1.schemaHasRulesButRef)(schema, self.RULES)) {
        self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
    }
}
function checkNoDefault(it) {
    const { schema, opts } = it;
    if (schema.default !== undefined && opts.useDefaults && opts.strictSchema) {
        (0, util_1.checkStrictMode)(it, "default is ignored in the schema root");
    }
}
function updateContext(it) {
    const schId = it.schema[it.opts.schemaId];
    if (schId)
        it.baseId = (0, resolve_1.resolveUrl)(it.opts.uriResolver, it.baseId, schId);
}
function checkAsyncSchema(it) {
    if (it.schema.$async && !it.schemaEnv.$async)
        throw new Error("async schema in sync schema");
}
function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
    const msg = schema.$comment;
    if (opts.$comment === true) {
        gen.code((0, codegen_1._) `${names_1.default.self}.logger.log(${msg})`);
    }
    else if (typeof opts.$comment == "function") {
        const schemaPath = (0, codegen_1.str) `${errSchemaPath}/$comment`;
        const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
        gen.code((0, codegen_1._) `${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
    }
}
function returnResults(it) {
    const { gen, schemaEnv, validateName, ValidationError, opts } = it;
    if (schemaEnv.$async) {
        // TODO assign unevaluated
        gen.if((0, codegen_1._) `${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw((0, codegen_1._) `new ${ValidationError}(${names_1.default.vErrors})`));
    }
    else {
        gen.assign((0, codegen_1._) `${validateName}.errors`, names_1.default.vErrors);
        if (opts.unevaluated)
            assignEvaluated(it);
        gen.return((0, codegen_1._) `${names_1.default.errors} === 0`);
    }
}
function assignEvaluated({ gen, evaluated, props, items }) {
    if (props instanceof codegen_1.Name)
        gen.assign((0, codegen_1._) `${evaluated}.props`, props);
    if (items instanceof codegen_1.Name)
        gen.assign((0, codegen_1._) `${evaluated}.items`, items);
}
function schemaKeywords(it, types, typeErrors, errsCount) {
    const { gen, schema, data, allErrors, opts, self } = it;
    const { RULES } = self;
    if (schema.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1.schemaHasRulesButRef)(schema, RULES))) {
        gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition)); // TODO typecast
        return;
    }
    if (!opts.jtd)
        checkStrictTypes(it, types);
    gen.block(() => {
        for (const group of RULES.rules)
            groupKeywords(group);
        groupKeywords(RULES.post);
    });
    function groupKeywords(group) {
        if (!(0, applicability_1.shouldUseGroup)(schema, group))
            return;
        if (group.type) {
            gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers));
            iterateKeywords(it, group);
            if (types.length === 1 && types[0] === group.type && typeErrors) {
                gen.else();
                (0, dataType_2.reportTypeError)(it);
            }
            gen.endIf();
        }
        else {
            iterateKeywords(it, group);
        }
        // TODO make it "ok" call?
        if (!allErrors)
            gen.if((0, codegen_1._) `${names_1.default.errors} === ${errsCount || 0}`);
    }
}
function iterateKeywords(it, group) {
    const { gen, schema, opts: { useDefaults }, } = it;
    if (useDefaults)
        (0, defaults_1.assignDefaults)(it, group.type);
    gen.block(() => {
        for (const rule of group.rules) {
            if ((0, applicability_1.shouldUseRule)(schema, rule)) {
                keywordCode(it, rule.keyword, rule.definition, group.type);
            }
        }
    });
}
function checkStrictTypes(it, types) {
    if (it.schemaEnv.meta || !it.opts.strictTypes)
        return;
    checkContextTypes(it, types);
    if (!it.opts.allowUnionTypes)
        checkMultipleTypes(it, types);
    checkKeywordTypes(it, it.dataTypes);
}
function checkContextTypes(it, types) {
    if (!types.length)
        return;
    if (!it.dataTypes.length) {
        it.dataTypes = types;
        return;
    }
    types.forEach((t) => {
        if (!includesType(it.dataTypes, t)) {
            strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
        }
    });
    narrowSchemaTypes(it, types);
}
function checkMultipleTypes(it, ts) {
    if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) {
        strictTypesError(it, "use allowUnionTypes to allow union type keyword");
    }
}
function checkKeywordTypes(it, ts) {
    const rules = it.self.RULES.all;
    for (const keyword in rules) {
        const rule = rules[keyword];
        if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
            const { type } = rule.definition;
            if (type.length && !type.some((t) => hasApplicableType(ts, t))) {
                strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
            }
        }
    }
}
function hasApplicableType(schTs, kwdT) {
    return schTs.includes(kwdT) || (kwdT === "number" && schTs.includes("integer"));
}
function includesType(ts, t) {
    return ts.includes(t) || (t === "integer" && ts.includes("number"));
}
function narrowSchemaTypes(it, withTypes) {
    const ts = [];
    for (const t of it.dataTypes) {
        if (includesType(withTypes, t))
            ts.push(t);
        else if (withTypes.includes("integer") && t === "number")
            ts.push("integer");
    }
    it.dataTypes = ts;
}
function strictTypesError(it, msg) {
    const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
    msg += ` at "${schemaPath}" (strictTypes)`;
    (0, util_1.checkStrictMode)(it, msg, it.opts.strictTypes);
}
class KeywordCxt {
    constructor(it, def, keyword) {
        (0, keyword_1.validateKeywordUsage)(it, def, keyword);
        this.gen = it.gen;
        this.allErrors = it.allErrors;
        this.keyword = keyword;
        this.data = it.data;
        this.schema = it.schema[keyword];
        this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data;
        this.schemaValue = (0, util_1.schemaRefOrVal)(it, this.schema, keyword, this.$data);
        this.schemaType = def.schemaType;
        this.parentSchema = it.schema;
        this.params = {};
        this.it = it;
        this.def = def;
        if (this.$data) {
            this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
        }
        else {
            this.schemaCode = this.schemaValue;
            if (!(0, keyword_1.validSchemaType)(this.schema, def.schemaType, def.allowUndefined)) {
                throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
            }
        }
        if ("code" in def ? def.trackErrors : def.errors !== false) {
            this.errsCount = it.gen.const("_errs", names_1.default.errors);
        }
    }
    result(condition, successAction, failAction) {
        this.failResult((0, codegen_1.not)(condition), successAction, failAction);
    }
    failResult(condition, successAction, failAction) {
        this.gen.if(condition);
        if (failAction)
            failAction();
        else
            this.error();
        if (successAction) {
            this.gen.else();
            successAction();
            if (this.allErrors)
                this.gen.endIf();
        }
        else {
            if (this.allErrors)
                this.gen.endIf();
            else
                this.gen.else();
        }
    }
    pass(condition, failAction) {
        this.failResult((0, codegen_1.not)(condition), undefined, failAction);
    }
    fail(condition) {
        if (condition === undefined) {
            this.error();
            if (!this.allErrors)
                this.gen.if(false); // this branch will be removed by gen.optimize
            return;
        }
        this.gen.if(condition);
        this.error();
        if (this.allErrors)
            this.gen.endIf();
        else
            this.gen.else();
    }
    fail$data(condition) {
        if (!this.$data)
            return this.fail(condition);
        const { schemaCode } = this;
        this.fail((0, codegen_1._) `${schemaCode} !== undefined && (${(0, codegen_1.or)(this.invalid$data(), condition)})`);
    }
    error(append, errorParams, errorPaths) {
        if (errorParams) {
            this.setParams(errorParams);
            this._error(append, errorPaths);
            this.setParams({});
            return;
        }
        this._error(append, errorPaths);
    }
    _error(append, errorPaths) {
        ;
        (append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
    }
    $dataError() {
        (0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
    }
    reset() {
        if (this.errsCount === undefined)
            throw new Error('add "trackErrors" to keyword definition');
        (0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(cond) {
        if (!this.allErrors)
            this.gen.if(cond);
    }
    setParams(obj, assign) {
        if (assign)
            Object.assign(this.params, obj);
        else
            this.params = obj;
    }
    block$data(valid, codeBlock, $dataValid = codegen_1.nil) {
        this.gen.block(() => {
            this.check$data(valid, $dataValid);
            codeBlock();
        });
    }
    check$data(valid = codegen_1.nil, $dataValid = codegen_1.nil) {
        if (!this.$data)
            return;
        const { gen, schemaCode, schemaType, def } = this;
        gen.if((0, codegen_1.or)((0, codegen_1._) `${schemaCode} === undefined`, $dataValid));
        if (valid !== codegen_1.nil)
            gen.assign(valid, true);
        if (schemaType.length || def.validateSchema) {
            gen.elseIf(this.invalid$data());
            this.$dataError();
            if (valid !== codegen_1.nil)
                gen.assign(valid, false);
        }
        gen.else();
    }
    invalid$data() {
        const { gen, schemaCode, schemaType, def, it } = this;
        return (0, codegen_1.or)(wrong$DataType(), invalid$DataSchema());
        function wrong$DataType() {
            if (schemaType.length) {
                /* istanbul ignore if */
                if (!(schemaCode instanceof codegen_1.Name))
                    throw new Error("ajv implementation error");
                const st = Array.isArray(schemaType) ? schemaType : [schemaType];
                return (0, codegen_1._) `${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
            }
            return codegen_1.nil;
        }
        function invalid$DataSchema() {
            if (def.validateSchema) {
                const validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema }); // TODO value.code for standalone
                return (0, codegen_1._) `!${validateSchemaRef}(${schemaCode})`;
            }
            return codegen_1.nil;
        }
    }
    subschema(appl, valid) {
        const subschema = (0, subschema_1.getSubschema)(this.it, appl);
        (0, subschema_1.extendSubschemaData)(subschema, this.it, appl);
        (0, subschema_1.extendSubschemaMode)(subschema, appl);
        const nextContext = { ...this.it, ...subschema, items: undefined, props: undefined };
        subschemaCode(nextContext, valid);
        return nextContext;
    }
    mergeEvaluated(schemaCxt, toName) {
        const { it, gen } = this;
        if (!it.opts.unevaluated)
            return;
        if (it.props !== true && schemaCxt.props !== undefined) {
            it.props = util_1.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
        }
        if (it.items !== true && schemaCxt.items !== undefined) {
            it.items = util_1.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
        }
    }
    mergeValidEvaluated(schemaCxt, valid) {
        const { it, gen } = this;
        if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
            gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1.Name));
            return true;
        }
    }
}
exports.KeywordCxt = KeywordCxt;
function keywordCode(it, keyword, def, ruleType) {
    const cxt = new KeywordCxt(it, def, keyword);
    if ("code" in def) {
        def.code(cxt, ruleType);
    }
    else if (cxt.$data && def.validate) {
        (0, keyword_1.funcKeywordCode)(cxt, def);
    }
    else if ("macro" in def) {
        (0, keyword_1.macroKeywordCode)(cxt, def);
    }
    else if (def.compile || def.validate) {
        (0, keyword_1.funcKeywordCode)(cxt, def);
    }
}
const JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
const RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
function getData($data, { dataLevel, dataNames, dataPathArr }) {
    let jsonPointer;
    let data;
    if ($data === "")
        return names_1.default.rootData;
    if ($data[0] === "/") {
        if (!JSON_POINTER.test($data))
            throw new Error(`Invalid JSON-pointer: ${$data}`);
        jsonPointer = $data;
        data = names_1.default.rootData;
    }
    else {
        const matches = RELATIVE_JSON_POINTER.exec($data);
        if (!matches)
            throw new Error(`Invalid JSON-pointer: ${$data}`);
        const up = +matches[1];
        jsonPointer = matches[2];
        if (jsonPointer === "#") {
            if (up >= dataLevel)
                throw new Error(errorMsg("property/index", up));
            return dataPathArr[dataLevel - up];
        }
        if (up > dataLevel)
            throw new Error(errorMsg("data", up));
        data = dataNames[dataLevel - up];
        if (!jsonPointer)
            return data;
    }
    let expr = data;
    const segments = jsonPointer.split("/");
    for (const segment of segments) {
        if (segment) {
            data = (0, codegen_1._) `${data}${(0, codegen_1.getProperty)((0, util_1.unescapeJsonPointer)(segment))}`;
            expr = (0, codegen_1._) `${expr} && ${data}`;
        }
    }
    return expr;
    function errorMsg(pointerType, up) {
        return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
    }
}
exports.getData = getData;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 5202:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateKeywordUsage = exports.validSchemaType = exports.funcKeywordCode = exports.macroKeywordCode = void 0;
const codegen_1 = __nccwpck_require__(1436);
const names_1 = __nccwpck_require__(630);
const code_1 = __nccwpck_require__(8484);
const errors_1 = __nccwpck_require__(1283);
function macroKeywordCode(cxt, def) {
    const { gen, keyword, schema, parentSchema, it } = cxt;
    const macroSchema = def.macro.call(it.self, schema, parentSchema, it);
    const schemaRef = useKeyword(gen, keyword, macroSchema);
    if (it.opts.validateSchema !== false)
        it.self.validateSchema(macroSchema, true);
    const valid = gen.name("valid");
    cxt.subschema({
        schema: macroSchema,
        schemaPath: codegen_1.nil,
        errSchemaPath: `${it.errSchemaPath}/${keyword}`,
        topSchemaRef: schemaRef,
        compositeRule: true,
    }, valid);
    cxt.pass(valid, () => cxt.error(true));
}
exports.macroKeywordCode = macroKeywordCode;
function funcKeywordCode(cxt, def) {
    var _a;
    const { gen, keyword, schema, parentSchema, $data, it } = cxt;
    checkAsyncKeyword(it, def);
    const validate = !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate;
    const validateRef = useKeyword(gen, keyword, validate);
    const valid = gen.let("valid");
    cxt.block$data(valid, validateKeyword);
    cxt.ok((_a = def.valid) !== null && _a !== void 0 ? _a : valid);
    function validateKeyword() {
        if (def.errors === false) {
            assignValid();
            if (def.modifying)
                modifyData(cxt);
            reportErrs(() => cxt.error());
        }
        else {
            const ruleErrs = def.async ? validateAsync() : validateSync();
            if (def.modifying)
                modifyData(cxt);
            reportErrs(() => addErrs(cxt, ruleErrs));
        }
    }
    function validateAsync() {
        const ruleErrs = gen.let("ruleErrs", null);
        gen.try(() => assignValid((0, codegen_1._) `await `), (e) => gen.assign(valid, false).if((0, codegen_1._) `${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1._) `${e}.errors`), () => gen.throw(e)));
        return ruleErrs;
    }
    function validateSync() {
        const validateErrs = (0, codegen_1._) `${validateRef}.errors`;
        gen.assign(validateErrs, null);
        assignValid(codegen_1.nil);
        return validateErrs;
    }
    function assignValid(_await = def.async ? (0, codegen_1._) `await ` : codegen_1.nil) {
        const passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
        const passSchema = !(("compile" in def && !$data) || def.schema === false);
        gen.assign(valid, (0, codegen_1._) `${_await}${(0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
    }
    function reportErrs(errors) {
        var _a;
        gen.if((0, codegen_1.not)((_a = def.valid) !== null && _a !== void 0 ? _a : valid), errors);
    }
}
exports.funcKeywordCode = funcKeywordCode;
function modifyData(cxt) {
    const { gen, data, it } = cxt;
    gen.if(it.parentData, () => gen.assign(data, (0, codegen_1._) `${it.parentData}[${it.parentDataProperty}]`));
}
function addErrs(cxt, errs) {
    const { gen } = cxt;
    gen.if((0, codegen_1._) `Array.isArray(${errs})`, () => {
        gen
            .assign(names_1.default.vErrors, (0, codegen_1._) `${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`)
            .assign(names_1.default.errors, (0, codegen_1._) `${names_1.default.vErrors}.length`);
        (0, errors_1.extendErrors)(cxt);
    }, () => cxt.error());
}
function checkAsyncKeyword({ schemaEnv }, def) {
    if (def.async && !schemaEnv.$async)
        throw new Error("async keyword in sync schema");
}
function useKeyword(gen, keyword, result) {
    if (result === undefined)
        throw new Error(`keyword "${keyword}" failed to compile`);
    return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: (0, codegen_1.stringify)(result) });
}
function validSchemaType(schema, schemaType, allowUndefined = false) {
    // TODO add tests
    return (!schemaType.length ||
        schemaType.some((st) => st === "array"
            ? Array.isArray(schema)
            : st === "object"
                ? schema && typeof schema == "object" && !Array.isArray(schema)
                : typeof schema == st || (allowUndefined && typeof schema == "undefined")));
}
exports.validSchemaType = validSchemaType;
function validateKeywordUsage({ schema, opts, self, errSchemaPath }, def, keyword) {
    /* istanbul ignore if */
    if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
        throw new Error("ajv implementation error");
    }
    const deps = def.dependencies;
    if (deps === null || deps === void 0 ? void 0 : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) {
        throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
    }
    if (def.validateSchema) {
        const valid = def.validateSchema(schema[keyword]);
        if (!valid) {
            const msg = `keyword "${keyword}" value is invalid at path "${errSchemaPath}": ` +
                self.errorsText(def.validateSchema.errors);
            if (opts.validateSchema === "log")
                self.logger.error(msg);
            else
                throw new Error(msg);
        }
    }
}
exports.validateKeywordUsage = validateKeywordUsage;
//# sourceMappingURL=keyword.js.map

/***/ }),

/***/ 6200:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extendSubschemaMode = exports.extendSubschemaData = exports.getSubschema = void 0;
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
function getSubschema(it, { keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef }) {
    if (keyword !== undefined && schema !== undefined) {
        throw new Error('both "keyword" and "schema" passed, only one allowed');
    }
    if (keyword !== undefined) {
        const sch = it.schema[keyword];
        return schemaProp === undefined
            ? {
                schema: sch,
                schemaPath: (0, codegen_1._) `${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}`,
                errSchemaPath: `${it.errSchemaPath}/${keyword}`,
            }
            : {
                schema: sch[schemaProp],
                schemaPath: (0, codegen_1._) `${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}${(0, codegen_1.getProperty)(schemaProp)}`,
                errSchemaPath: `${it.errSchemaPath}/${keyword}/${(0, util_1.escapeFragment)(schemaProp)}`,
            };
    }
    if (schema !== undefined) {
        if (schemaPath === undefined || errSchemaPath === undefined || topSchemaRef === undefined) {
            throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
        }
        return {
            schema,
            schemaPath,
            topSchemaRef,
            errSchemaPath,
        };
    }
    throw new Error('either "keyword" or "schema" must be passed');
}
exports.getSubschema = getSubschema;
function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
    if (data !== undefined && dataProp !== undefined) {
        throw new Error('both "data" and "dataProp" passed, only one allowed');
    }
    const { gen } = it;
    if (dataProp !== undefined) {
        const { errorPath, dataPathArr, opts } = it;
        const nextData = gen.let("data", (0, codegen_1._) `${it.data}${(0, codegen_1.getProperty)(dataProp)}`, true);
        dataContextProps(nextData);
        subschema.errorPath = (0, codegen_1.str) `${errorPath}${(0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`;
        subschema.parentDataProperty = (0, codegen_1._) `${dataProp}`;
        subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
    }
    if (data !== undefined) {
        const nextData = data instanceof codegen_1.Name ? data : gen.let("data", data, true); // replaceable if used once?
        dataContextProps(nextData);
        if (propertyName !== undefined)
            subschema.propertyName = propertyName;
        // TODO something is possibly wrong here with not changing parentDataProperty and not appending dataPathArr
    }
    if (dataTypes)
        subschema.dataTypes = dataTypes;
    function dataContextProps(_nextData) {
        subschema.data = _nextData;
        subschema.dataLevel = it.dataLevel + 1;
        subschema.dataTypes = [];
        it.definedProperties = new Set();
        subschema.parentData = it.data;
        subschema.dataNames = [...it.dataNames, _nextData];
    }
}
exports.extendSubschemaData = extendSubschemaData;
function extendSubschemaMode(subschema, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
    if (compositeRule !== undefined)
        subschema.compositeRule = compositeRule;
    if (createErrors !== undefined)
        subschema.createErrors = createErrors;
    if (allErrors !== undefined)
        subschema.allErrors = allErrors;
    subschema.jtdDiscriminator = jtdDiscriminator; // not inherited
    subschema.jtdMetadata = jtdMetadata; // not inherited
}
exports.extendSubschemaMode = extendSubschemaMode;
//# sourceMappingURL=subschema.js.map

/***/ }),

/***/ 3893:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = void 0;
var validate_1 = __nccwpck_require__(7881);
Object.defineProperty(exports, "KeywordCxt", ({ enumerable: true, get: function () { return validate_1.KeywordCxt; } }));
var codegen_1 = __nccwpck_require__(1436);
Object.defineProperty(exports, "_", ({ enumerable: true, get: function () { return codegen_1._; } }));
Object.defineProperty(exports, "str", ({ enumerable: true, get: function () { return codegen_1.str; } }));
Object.defineProperty(exports, "stringify", ({ enumerable: true, get: function () { return codegen_1.stringify; } }));
Object.defineProperty(exports, "nil", ({ enumerable: true, get: function () { return codegen_1.nil; } }));
Object.defineProperty(exports, "Name", ({ enumerable: true, get: function () { return codegen_1.Name; } }));
Object.defineProperty(exports, "CodeGen", ({ enumerable: true, get: function () { return codegen_1.CodeGen; } }));
const validation_error_1 = __nccwpck_require__(3021);
const ref_error_1 = __nccwpck_require__(3162);
const rules_1 = __nccwpck_require__(7353);
const compile_1 = __nccwpck_require__(2718);
const codegen_2 = __nccwpck_require__(1436);
const resolve_1 = __nccwpck_require__(4090);
const dataType_1 = __nccwpck_require__(6685);
const util_1 = __nccwpck_require__(4464);
const $dataRefSchema = __nccwpck_require__(3837);
const uri_1 = __nccwpck_require__(6285);
const defaultRegExp = (str, flags) => new RegExp(str, flags);
defaultRegExp.code = "new RegExp";
const META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"];
const EXT_SCOPE_NAMES = new Set([
    "validate",
    "serialize",
    "parse",
    "wrapper",
    "root",
    "schema",
    "keyword",
    "pattern",
    "formats",
    "validate$data",
    "func",
    "obj",
    "Error",
]);
const removedOptions = {
    errorDataPath: "",
    format: "`validateFormats: false` can be used instead.",
    nullable: '"nullable" keyword is supported by default.',
    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
    sourceCode: "Use option `code: {source: true}`",
    strictDefaults: "It is default now, see option `strict`.",
    strictKeywords: "It is default now, see option `strict`.",
    uniqueItems: '"uniqueItems" keyword is always validated.',
    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
    cache: "Map is used as cache, schema object as key.",
    serialize: "Map is used as cache, schema object as key.",
    ajvErrors: "It is default now.",
};
const deprecatedOptions = {
    ignoreKeywordsWithRef: "",
    jsPropertySyntax: "",
    unicode: '"minLength"/"maxLength" account for unicode characters by default.',
};
const MAX_EXPRESSION = 200;
// eslint-disable-next-line complexity
function requiredOptions(o) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    const s = o.strict;
    const _optz = (_a = o.code) === null || _a === void 0 ? void 0 : _a.optimize;
    const optimize = _optz === true || _optz === undefined ? 1 : _optz || 0;
    const regExp = (_c = (_b = o.code) === null || _b === void 0 ? void 0 : _b.regExp) !== null && _c !== void 0 ? _c : defaultRegExp;
    const uriResolver = (_d = o.uriResolver) !== null && _d !== void 0 ? _d : uri_1.default;
    return {
        strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== void 0 ? _e : s) !== null && _f !== void 0 ? _f : true,
        strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== void 0 ? _g : s) !== null && _h !== void 0 ? _h : true,
        strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== void 0 ? _j : s) !== null && _k !== void 0 ? _k : "log",
        strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== void 0 ? _l : s) !== null && _m !== void 0 ? _m : "log",
        strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== void 0 ? _o : s) !== null && _p !== void 0 ? _p : false,
        code: o.code ? { ...o.code, optimize, regExp } : { optimize, regExp },
        loopRequired: (_q = o.loopRequired) !== null && _q !== void 0 ? _q : MAX_EXPRESSION,
        loopEnum: (_r = o.loopEnum) !== null && _r !== void 0 ? _r : MAX_EXPRESSION,
        meta: (_s = o.meta) !== null && _s !== void 0 ? _s : true,
        messages: (_t = o.messages) !== null && _t !== void 0 ? _t : true,
        inlineRefs: (_u = o.inlineRefs) !== null && _u !== void 0 ? _u : true,
        schemaId: (_v = o.schemaId) !== null && _v !== void 0 ? _v : "$id",
        addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== void 0 ? _w : true,
        validateSchema: (_x = o.validateSchema) !== null && _x !== void 0 ? _x : true,
        validateFormats: (_y = o.validateFormats) !== null && _y !== void 0 ? _y : true,
        unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== void 0 ? _z : true,
        int32range: (_0 = o.int32range) !== null && _0 !== void 0 ? _0 : true,
        uriResolver: uriResolver,
    };
}
class Ajv {
    constructor(opts = {}) {
        this.schemas = {};
        this.refs = {};
        this.formats = Object.create(null);
        this._compilations = new Set();
        this._loading = {};
        this._cache = new Map();
        opts = this.opts = { ...opts, ...requiredOptions(opts) };
        const { es5, lines } = this.opts.code;
        this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines });
        this.logger = getLogger(opts.logger);
        const formatOpt = opts.validateFormats;
        opts.validateFormats = false;
        this.RULES = (0, rules_1.getRules)();
        checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
        checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
        this._metaOpts = getMetaSchemaOptions.call(this);
        if (opts.formats)
            addInitialFormats.call(this);
        this._addVocabularies();
        this._addDefaultMetaSchema();
        if (opts.keywords)
            addInitialKeywords.call(this, opts.keywords);
        if (typeof opts.meta == "object")
            this.addMetaSchema(opts.meta);
        addInitialSchemas.call(this);
        opts.validateFormats = formatOpt;
    }
    _addVocabularies() {
        this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
        const { $data, meta, schemaId } = this.opts;
        let _dataRefSchema = $dataRefSchema;
        if (schemaId === "id") {
            _dataRefSchema = { ...$dataRefSchema };
            _dataRefSchema.id = _dataRefSchema.$id;
            delete _dataRefSchema.$id;
        }
        if (meta && $data)
            this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
    }
    defaultMeta() {
        const { meta, schemaId } = this.opts;
        return (this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : undefined);
    }
    validate(schemaKeyRef, // key, ref or schema object
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    data // to be validated
    ) {
        let v;
        if (typeof schemaKeyRef == "string") {
            v = this.getSchema(schemaKeyRef);
            if (!v)
                throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
        }
        else {
            v = this.compile(schemaKeyRef);
        }
        const valid = v(data);
        if (!("$async" in v))
            this.errors = v.errors;
        return valid;
    }
    compile(schema, _meta) {
        const sch = this._addSchema(schema, _meta);
        return (sch.validate || this._compileSchemaEnv(sch));
    }
    compileAsync(schema, meta) {
        if (typeof this.opts.loadSchema != "function") {
            throw new Error("options.loadSchema should be a function");
        }
        const { loadSchema } = this.opts;
        return runCompileAsync.call(this, schema, meta);
        async function runCompileAsync(_schema, _meta) {
            await loadMetaSchema.call(this, _schema.$schema);
            const sch = this._addSchema(_schema, _meta);
            return sch.validate || _compileAsync.call(this, sch);
        }
        async function loadMetaSchema($ref) {
            if ($ref && !this.getSchema($ref)) {
                await runCompileAsync.call(this, { $ref }, true);
            }
        }
        async function _compileAsync(sch) {
            try {
                return this._compileSchemaEnv(sch);
            }
            catch (e) {
                if (!(e instanceof ref_error_1.default))
                    throw e;
                checkLoaded.call(this, e);
                await loadMissingSchema.call(this, e.missingSchema);
                return _compileAsync.call(this, sch);
            }
        }
        function checkLoaded({ missingSchema: ref, missingRef }) {
            if (this.refs[ref]) {
                throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
            }
        }
        async function loadMissingSchema(ref) {
            const _schema = await _loadSchema.call(this, ref);
            if (!this.refs[ref])
                await loadMetaSchema.call(this, _schema.$schema);
            if (!this.refs[ref])
                this.addSchema(_schema, ref, meta);
        }
        async function _loadSchema(ref) {
            const p = this._loading[ref];
            if (p)
                return p;
            try {
                return await (this._loading[ref] = loadSchema(ref));
            }
            finally {
                delete this._loading[ref];
            }
        }
    }
    // Adds schema to the instance
    addSchema(schema, // If array is passed, `key` will be ignored
    key, // Optional schema key. Can be passed to `validate` method instead of schema object or id/ref. One schema per instance can have empty `id` and `key`.
    _meta, // true if schema is a meta-schema. Used internally, addMetaSchema should be used instead.
    _validateSchema = this.opts.validateSchema // false to skip schema validation. Used internally, option validateSchema should be used instead.
    ) {
        if (Array.isArray(schema)) {
            for (const sch of schema)
                this.addSchema(sch, undefined, _meta, _validateSchema);
            return this;
        }
        let id;
        if (typeof schema === "object") {
            const { schemaId } = this.opts;
            id = schema[schemaId];
            if (id !== undefined && typeof id != "string") {
                throw new Error(`schema ${schemaId} must be string`);
            }
        }
        key = (0, resolve_1.normalizeId)(key || id);
        this._checkUnique(key);
        this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, true);
        return this;
    }
    // Add schema that will be used to validate other schemas
    // options in META_IGNORE_OPTIONS are alway set to false
    addMetaSchema(schema, key, // schema key
    _validateSchema = this.opts.validateSchema // false to skip schema validation, can be used to override validateSchema option for meta-schema
    ) {
        this.addSchema(schema, key, true, _validateSchema);
        return this;
    }
    //  Validate schema against its meta-schema
    validateSchema(schema, throwOrLogError) {
        if (typeof schema == "boolean")
            return true;
        let $schema;
        $schema = schema.$schema;
        if ($schema !== undefined && typeof $schema != "string") {
            throw new Error("$schema must be a string");
        }
        $schema = $schema || this.opts.defaultMeta || this.defaultMeta();
        if (!$schema) {
            this.logger.warn("meta-schema not available");
            this.errors = null;
            return true;
        }
        const valid = this.validate($schema, schema);
        if (!valid && throwOrLogError) {
            const message = "schema is invalid: " + this.errorsText();
            if (this.opts.validateSchema === "log")
                this.logger.error(message);
            else
                throw new Error(message);
        }
        return valid;
    }
    // Get compiled schema by `key` or `ref`.
    // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
    getSchema(keyRef) {
        let sch;
        while (typeof (sch = getSchEnv.call(this, keyRef)) == "string")
            keyRef = sch;
        if (sch === undefined) {
            const { schemaId } = this.opts;
            const root = new compile_1.SchemaEnv({ schema: {}, schemaId });
            sch = compile_1.resolveSchema.call(this, root, keyRef);
            if (!sch)
                return;
            this.refs[keyRef] = sch;
        }
        return (sch.validate || this._compileSchemaEnv(sch));
    }
    // Remove cached schema(s).
    // If no parameter is passed all schemas but meta-schemas are removed.
    // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
    // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
    removeSchema(schemaKeyRef) {
        if (schemaKeyRef instanceof RegExp) {
            this._removeAllSchemas(this.schemas, schemaKeyRef);
            this._removeAllSchemas(this.refs, schemaKeyRef);
            return this;
        }
        switch (typeof schemaKeyRef) {
            case "undefined":
                this._removeAllSchemas(this.schemas);
                this._removeAllSchemas(this.refs);
                this._cache.clear();
                return this;
            case "string": {
                const sch = getSchEnv.call(this, schemaKeyRef);
                if (typeof sch == "object")
                    this._cache.delete(sch.schema);
                delete this.schemas[schemaKeyRef];
                delete this.refs[schemaKeyRef];
                return this;
            }
            case "object": {
                const cacheKey = schemaKeyRef;
                this._cache.delete(cacheKey);
                let id = schemaKeyRef[this.opts.schemaId];
                if (id) {
                    id = (0, resolve_1.normalizeId)(id);
                    delete this.schemas[id];
                    delete this.refs[id];
                }
                return this;
            }
            default:
                throw new Error("ajv.removeSchema: invalid parameter");
        }
    }
    // add "vocabulary" - a collection of keywords
    addVocabulary(definitions) {
        for (const def of definitions)
            this.addKeyword(def);
        return this;
    }
    addKeyword(kwdOrDef, def // deprecated
    ) {
        let keyword;
        if (typeof kwdOrDef == "string") {
            keyword = kwdOrDef;
            if (typeof def == "object") {
                this.logger.warn("these parameters are deprecated, see docs for addKeyword");
                def.keyword = keyword;
            }
        }
        else if (typeof kwdOrDef == "object" && def === undefined) {
            def = kwdOrDef;
            keyword = def.keyword;
            if (Array.isArray(keyword) && !keyword.length) {
                throw new Error("addKeywords: keyword must be string or non-empty array");
            }
        }
        else {
            throw new Error("invalid addKeywords parameters");
        }
        checkKeyword.call(this, keyword, def);
        if (!def) {
            (0, util_1.eachItem)(keyword, (kwd) => addRule.call(this, kwd));
            return this;
        }
        keywordMetaschema.call(this, def);
        const definition = {
            ...def,
            type: (0, dataType_1.getJSONTypes)(def.type),
            schemaType: (0, dataType_1.getJSONTypes)(def.schemaType),
        };
        (0, util_1.eachItem)(keyword, definition.type.length === 0
            ? (k) => addRule.call(this, k, definition)
            : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
        return this;
    }
    getKeyword(keyword) {
        const rule = this.RULES.all[keyword];
        return typeof rule == "object" ? rule.definition : !!rule;
    }
    // Remove keyword
    removeKeyword(keyword) {
        // TODO return type should be Ajv
        const { RULES } = this;
        delete RULES.keywords[keyword];
        delete RULES.all[keyword];
        for (const group of RULES.rules) {
            const i = group.rules.findIndex((rule) => rule.keyword === keyword);
            if (i >= 0)
                group.rules.splice(i, 1);
        }
        return this;
    }
    // Add format
    addFormat(name, format) {
        if (typeof format == "string")
            format = new RegExp(format);
        this.formats[name] = format;
        return this;
    }
    errorsText(errors = this.errors, // optional array of validation errors
    { separator = ", ", dataVar = "data" } = {} // optional options with properties `separator` and `dataVar`
    ) {
        if (!errors || errors.length === 0)
            return "No errors";
        return errors
            .map((e) => `${dataVar}${e.instancePath} ${e.message}`)
            .reduce((text, msg) => text + separator + msg);
    }
    $dataMetaSchema(metaSchema, keywordsJsonPointers) {
        const rules = this.RULES.all;
        metaSchema = JSON.parse(JSON.stringify(metaSchema));
        for (const jsonPointer of keywordsJsonPointers) {
            const segments = jsonPointer.split("/").slice(1); // first segment is an empty string
            let keywords = metaSchema;
            for (const seg of segments)
                keywords = keywords[seg];
            for (const key in rules) {
                const rule = rules[key];
                if (typeof rule != "object")
                    continue;
                const { $data } = rule.definition;
                const schema = keywords[key];
                if ($data && schema)
                    keywords[key] = schemaOrData(schema);
            }
        }
        return metaSchema;
    }
    _removeAllSchemas(schemas, regex) {
        for (const keyRef in schemas) {
            const sch = schemas[keyRef];
            if (!regex || regex.test(keyRef)) {
                if (typeof sch == "string") {
                    delete schemas[keyRef];
                }
                else if (sch && !sch.meta) {
                    this._cache.delete(sch.schema);
                    delete schemas[keyRef];
                }
            }
        }
    }
    _addSchema(schema, meta, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
        let id;
        const { schemaId } = this.opts;
        if (typeof schema == "object") {
            id = schema[schemaId];
        }
        else {
            if (this.opts.jtd)
                throw new Error("schema must be object");
            else if (typeof schema != "boolean")
                throw new Error("schema must be object or boolean");
        }
        let sch = this._cache.get(schema);
        if (sch !== undefined)
            return sch;
        baseId = (0, resolve_1.normalizeId)(id || baseId);
        const localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
        sch = new compile_1.SchemaEnv({ schema, schemaId, meta, baseId, localRefs });
        this._cache.set(sch.schema, sch);
        if (addSchema && !baseId.startsWith("#")) {
            // TODO atm it is allowed to overwrite schemas without id (instead of not adding them)
            if (baseId)
                this._checkUnique(baseId);
            this.refs[baseId] = sch;
        }
        if (validateSchema)
            this.validateSchema(schema, true);
        return sch;
    }
    _checkUnique(id) {
        if (this.schemas[id] || this.refs[id]) {
            throw new Error(`schema with key or id "${id}" already exists`);
        }
    }
    _compileSchemaEnv(sch) {
        if (sch.meta)
            this._compileMetaSchema(sch);
        else
            compile_1.compileSchema.call(this, sch);
        /* istanbul ignore if */
        if (!sch.validate)
            throw new Error("ajv implementation error");
        return sch.validate;
    }
    _compileMetaSchema(sch) {
        const currentOpts = this.opts;
        this.opts = this._metaOpts;
        try {
            compile_1.compileSchema.call(this, sch);
        }
        finally {
            this.opts = currentOpts;
        }
    }
}
Ajv.ValidationError = validation_error_1.default;
Ajv.MissingRefError = ref_error_1.default;
exports["default"] = Ajv;
function checkOptions(checkOpts, options, msg, log = "error") {
    for (const key in checkOpts) {
        const opt = key;
        if (opt in options)
            this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`);
    }
}
function getSchEnv(keyRef) {
    keyRef = (0, resolve_1.normalizeId)(keyRef); // TODO tests fail without this line
    return this.schemas[keyRef] || this.refs[keyRef];
}
function addInitialSchemas() {
    const optsSchemas = this.opts.schemas;
    if (!optsSchemas)
        return;
    if (Array.isArray(optsSchemas))
        this.addSchema(optsSchemas);
    else
        for (const key in optsSchemas)
            this.addSchema(optsSchemas[key], key);
}
function addInitialFormats() {
    for (const name in this.opts.formats) {
        const format = this.opts.formats[name];
        if (format)
            this.addFormat(name, format);
    }
}
function addInitialKeywords(defs) {
    if (Array.isArray(defs)) {
        this.addVocabulary(defs);
        return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const keyword in defs) {
        const def = defs[keyword];
        if (!def.keyword)
            def.keyword = keyword;
        this.addKeyword(def);
    }
}
function getMetaSchemaOptions() {
    const metaOpts = { ...this.opts };
    for (const opt of META_IGNORE_OPTIONS)
        delete metaOpts[opt];
    return metaOpts;
}
const noLogs = { log() { }, warn() { }, error() { } };
function getLogger(logger) {
    if (logger === false)
        return noLogs;
    if (logger === undefined)
        return console;
    if (logger.log && logger.warn && logger.error)
        return logger;
    throw new Error("logger must implement log, warn and error methods");
}
const KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
function checkKeyword(keyword, def) {
    const { RULES } = this;
    (0, util_1.eachItem)(keyword, (kwd) => {
        if (RULES.keywords[kwd])
            throw new Error(`Keyword ${kwd} is already defined`);
        if (!KEYWORD_NAME.test(kwd))
            throw new Error(`Keyword ${kwd} has invalid name`);
    });
    if (!def)
        return;
    if (def.$data && !("code" in def || "validate" in def)) {
        throw new Error('$data keyword must have "code" or "validate" function');
    }
}
function addRule(keyword, definition, dataType) {
    var _a;
    const post = definition === null || definition === void 0 ? void 0 : definition.post;
    if (dataType && post)
        throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES } = this;
    let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType);
    if (!ruleGroup) {
        ruleGroup = { type: dataType, rules: [] };
        RULES.rules.push(ruleGroup);
    }
    RULES.keywords[keyword] = true;
    if (!definition)
        return;
    const rule = {
        keyword,
        definition: {
            ...definition,
            type: (0, dataType_1.getJSONTypes)(definition.type),
            schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType),
        },
    };
    if (definition.before)
        addBeforeRule.call(this, ruleGroup, rule, definition.before);
    else
        ruleGroup.rules.push(rule);
    RULES.all[keyword] = rule;
    (_a = definition.implements) === null || _a === void 0 ? void 0 : _a.forEach((kwd) => this.addKeyword(kwd));
}
function addBeforeRule(ruleGroup, rule, before) {
    const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
    if (i >= 0) {
        ruleGroup.rules.splice(i, 0, rule);
    }
    else {
        ruleGroup.rules.push(rule);
        this.logger.warn(`rule ${before} is not defined`);
    }
}
function keywordMetaschema(def) {
    let { metaSchema } = def;
    if (metaSchema === undefined)
        return;
    if (def.$data && this.opts.$data)
        metaSchema = schemaOrData(metaSchema);
    def.validateSchema = this.compile(metaSchema, true);
}
const $dataRef = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
};
function schemaOrData(schema) {
    return { anyOf: [schema, $dataRef] };
}
//# sourceMappingURL=core.js.map

/***/ }),

/***/ 3995:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const metaSchema = __nccwpck_require__(1678);
const applicator = __nccwpck_require__(7216);
const unevaluated = __nccwpck_require__(9547);
const content = __nccwpck_require__(8226);
const core = __nccwpck_require__(518);
const format = __nccwpck_require__(4588);
const metadata = __nccwpck_require__(5707);
const validation = __nccwpck_require__(7082);
const META_SUPPORT_DATA = ["/properties"];
function addMetaSchema2020($data) {
    ;
    [
        metaSchema,
        applicator,
        unevaluated,
        content,
        core,
        with$data(this, format),
        metadata,
        with$data(this, validation),
    ].forEach((sch) => this.addMetaSchema(sch, undefined, false));
    return this;
    function with$data(ajv, sch) {
        return $data ? ajv.$dataMetaSchema(sch, META_SUPPORT_DATA) : sch;
    }
}
exports["default"] = addMetaSchema2020;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 4951:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
// https://github.com/ajv-validator/ajv/issues/889
const equal = __nccwpck_require__(3430);
equal.code = 'require("ajv/dist/runtime/equal").default';
exports["default"] = equal;
//# sourceMappingURL=equal.js.map

/***/ }),

/***/ 6214:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
// https://mathiasbynens.be/notes/javascript-encoding
// https://github.com/bestiejs/punycode.js - punycode.ucs2.decode
function ucs2length(str) {
    const len = str.length;
    let length = 0;
    let pos = 0;
    let value;
    while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 0xd800 && value <= 0xdbff && pos < len) {
            // high surrogate, and there is a next character
            value = str.charCodeAt(pos);
            if ((value & 0xfc00) === 0xdc00)
                pos++; // low surrogate
        }
    }
    return length;
}
exports["default"] = ucs2length;
ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
//# sourceMappingURL=ucs2length.js.map

/***/ }),

/***/ 6285:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const uri = __nccwpck_require__(4352);
uri.code = 'require("ajv/dist/runtime/uri").default';
exports["default"] = uri;
//# sourceMappingURL=uri.js.map

/***/ }),

/***/ 3021:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class ValidationError extends Error {
    constructor(errors) {
        super("validation failed");
        this.errors = errors;
        this.ajv = this.validation = true;
    }
}
exports["default"] = ValidationError;
//# sourceMappingURL=validation_error.js.map

/***/ }),

/***/ 3448:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateAdditionalItems = void 0;
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const error = {
    message: ({ params: { len } }) => (0, codegen_1.str) `must NOT have more than ${len} items`,
    params: ({ params: { len } }) => (0, codegen_1._) `{limit: ${len}}`,
};
const def = {
    keyword: "additionalItems",
    type: "array",
    schemaType: ["boolean", "object"],
    before: "uniqueItems",
    error,
    code(cxt) {
        const { parentSchema, it } = cxt;
        const { items } = parentSchema;
        if (!Array.isArray(items)) {
            (0, util_1.checkStrictMode)(it, '"additionalItems" is ignored when "items" is not an array of schemas');
            return;
        }
        validateAdditionalItems(cxt, items);
    },
};
function validateAdditionalItems(cxt, items) {
    const { gen, schema, data, keyword, it } = cxt;
    it.items = true;
    const len = gen.const("len", (0, codegen_1._) `${data}.length`);
    if (schema === false) {
        cxt.setParams({ len: items.length });
        cxt.pass((0, codegen_1._) `${len} <= ${items.length}`);
    }
    else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
        const valid = gen.var("valid", (0, codegen_1._) `${len} <= ${items.length}`); // TODO var
        gen.if((0, codegen_1.not)(valid), () => validateItems(valid));
        cxt.ok(valid);
    }
    function validateItems(valid) {
        gen.forRange("i", items.length, len, (i) => {
            cxt.subschema({ keyword, dataProp: i, dataPropType: util_1.Type.Num }, valid);
            if (!it.allErrors)
                gen.if((0, codegen_1.not)(valid), () => gen.break());
        });
    }
}
exports.validateAdditionalItems = validateAdditionalItems;
exports["default"] = def;
//# sourceMappingURL=additionalItems.js.map

/***/ }),

/***/ 2431:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const code_1 = __nccwpck_require__(8484);
const codegen_1 = __nccwpck_require__(1436);
const names_1 = __nccwpck_require__(630);
const util_1 = __nccwpck_require__(4464);
const error = {
    message: "must NOT have additional properties",
    params: ({ params }) => (0, codegen_1._) `{additionalProperty: ${params.additionalProperty}}`,
};
const def = {
    keyword: "additionalProperties",
    type: ["object"],
    schemaType: ["boolean", "object"],
    allowUndefined: true,
    trackErrors: true,
    error,
    code(cxt) {
        const { gen, schema, parentSchema, data, errsCount, it } = cxt;
        /* istanbul ignore if */
        if (!errsCount)
            throw new Error("ajv implementation error");
        const { allErrors, opts } = it;
        it.props = true;
        if (opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema))
            return;
        const props = (0, code_1.allSchemaProperties)(parentSchema.properties);
        const patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
        checkAdditionalProperties();
        cxt.ok((0, codegen_1._) `${errsCount} === ${names_1.default.errors}`);
        function checkAdditionalProperties() {
            gen.forIn("key", data, (key) => {
                if (!props.length && !patProps.length)
                    additionalPropertyCode(key);
                else
                    gen.if(isAdditional(key), () => additionalPropertyCode(key));
            });
        }
        function isAdditional(key) {
            let definedProp;
            if (props.length > 8) {
                // TODO maybe an option instead of hard-coded 8?
                const propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
                definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key);
            }
            else if (props.length) {
                definedProp = (0, codegen_1.or)(...props.map((p) => (0, codegen_1._) `${key} === ${p}`));
            }
            else {
                definedProp = codegen_1.nil;
            }
            if (patProps.length) {
                definedProp = (0, codegen_1.or)(definedProp, ...patProps.map((p) => (0, codegen_1._) `${(0, code_1.usePattern)(cxt, p)}.test(${key})`));
            }
            return (0, codegen_1.not)(definedProp);
        }
        function deleteAdditional(key) {
            gen.code((0, codegen_1._) `delete ${data}[${key}]`);
        }
        function additionalPropertyCode(key) {
            if (opts.removeAdditional === "all" || (opts.removeAdditional && schema === false)) {
                deleteAdditional(key);
                return;
            }
            if (schema === false) {
                cxt.setParams({ additionalProperty: key });
                cxt.error();
                if (!allErrors)
                    gen.break();
                return;
            }
            if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
                const valid = gen.name("valid");
                if (opts.removeAdditional === "failing") {
                    applyAdditionalSchema(key, valid, false);
                    gen.if((0, codegen_1.not)(valid), () => {
                        cxt.reset();
                        deleteAdditional(key);
                    });
                }
                else {
                    applyAdditionalSchema(key, valid);
                    if (!allErrors)
                        gen.if((0, codegen_1.not)(valid), () => gen.break());
                }
            }
        }
        function applyAdditionalSchema(key, valid, errors) {
            const subschema = {
                keyword: "additionalProperties",
                dataProp: key,
                dataPropType: util_1.Type.Str,
            };
            if (errors === false) {
                Object.assign(subschema, {
                    compositeRule: true,
                    createErrors: false,
                    allErrors: false,
                });
            }
            cxt.subschema(subschema, valid);
        }
    },
};
exports["default"] = def;
//# sourceMappingURL=additionalProperties.js.map

/***/ }),

/***/ 9205:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const util_1 = __nccwpck_require__(4464);
const def = {
    keyword: "allOf",
    schemaType: "array",
    code(cxt) {
        const { gen, schema, it } = cxt;
        /* istanbul ignore if */
        if (!Array.isArray(schema))
            throw new Error("ajv implementation error");
        const valid = gen.name("valid");
        schema.forEach((sch, i) => {
            if ((0, util_1.alwaysValidSchema)(it, sch))
                return;
            const schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
            cxt.ok(valid);
            cxt.mergeEvaluated(schCxt);
        });
    },
};
exports["default"] = def;
//# sourceMappingURL=allOf.js.map

/***/ }),

/***/ 9380:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const code_1 = __nccwpck_require__(8484);
const def = {
    keyword: "anyOf",
    schemaType: "array",
    trackErrors: true,
    code: code_1.validateUnion,
    error: { message: "must match a schema in anyOf" },
};
exports["default"] = def;
//# sourceMappingURL=anyOf.js.map

/***/ }),

/***/ 6182:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const error = {
    message: ({ params: { min, max } }) => max === undefined
        ? (0, codegen_1.str) `must contain at least ${min} valid item(s)`
        : (0, codegen_1.str) `must contain at least ${min} and no more than ${max} valid item(s)`,
    params: ({ params: { min, max } }) => max === undefined ? (0, codegen_1._) `{minContains: ${min}}` : (0, codegen_1._) `{minContains: ${min}, maxContains: ${max}}`,
};
const def = {
    keyword: "contains",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    trackErrors: true,
    error,
    code(cxt) {
        const { gen, schema, parentSchema, data, it } = cxt;
        let min;
        let max;
        const { minContains, maxContains } = parentSchema;
        if (it.opts.next) {
            min = minContains === undefined ? 1 : minContains;
            max = maxContains;
        }
        else {
            min = 1;
        }
        const len = gen.const("len", (0, codegen_1._) `${data}.length`);
        cxt.setParams({ min, max });
        if (max === undefined && min === 0) {
            (0, util_1.checkStrictMode)(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
            return;
        }
        if (max !== undefined && min > max) {
            (0, util_1.checkStrictMode)(it, `"minContains" > "maxContains" is always invalid`);
            cxt.fail();
            return;
        }
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
            let cond = (0, codegen_1._) `${len} >= ${min}`;
            if (max !== undefined)
                cond = (0, codegen_1._) `${cond} && ${len} <= ${max}`;
            cxt.pass(cond);
            return;
        }
        it.items = true;
        const valid = gen.name("valid");
        if (max === undefined && min === 1) {
            validateItems(valid, () => gen.if(valid, () => gen.break()));
        }
        else if (min === 0) {
            gen.let(valid, true);
            if (max !== undefined)
                gen.if((0, codegen_1._) `${data}.length > 0`, validateItemsWithCount);
        }
        else {
            gen.let(valid, false);
            validateItemsWithCount();
        }
        cxt.result(valid, () => cxt.reset());
        function validateItemsWithCount() {
            const schValid = gen.name("_valid");
            const count = gen.let("count", 0);
            validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
        }
        function validateItems(_valid, block) {
            gen.forRange("i", 0, len, (i) => {
                cxt.subschema({
                    keyword: "contains",
                    dataProp: i,
                    dataPropType: util_1.Type.Num,
                    compositeRule: true,
                }, _valid);
                block();
            });
        }
        function checkLimits(count) {
            gen.code((0, codegen_1._) `${count}++`);
            if (max === undefined) {
                gen.if((0, codegen_1._) `${count} >= ${min}`, () => gen.assign(valid, true).break());
            }
            else {
                gen.if((0, codegen_1._) `${count} > ${max}`, () => gen.assign(valid, false).break());
                if (min === 1)
                    gen.assign(valid, true);
                else
                    gen.if((0, codegen_1._) `${count} >= ${min}`, () => gen.assign(valid, true));
            }
        }
    },
};
exports["default"] = def;
//# sourceMappingURL=contains.js.map

/***/ }),

/***/ 5826:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = void 0;
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const code_1 = __nccwpck_require__(8484);
exports.error = {
    message: ({ params: { property, depsCount, deps } }) => {
        const property_ies = depsCount === 1 ? "property" : "properties";
        return (0, codegen_1.str) `must have ${property_ies} ${deps} when property ${property} is present`;
    },
    params: ({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_1._) `{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`, // TODO change to reference
};
const def = {
    keyword: "dependencies",
    type: "object",
    schemaType: "object",
    error: exports.error,
    code(cxt) {
        const [propDeps, schDeps] = splitDependencies(cxt);
        validatePropertyDeps(cxt, propDeps);
        validateSchemaDeps(cxt, schDeps);
    },
};
function splitDependencies({ schema }) {
    const propertyDeps = {};
    const schemaDeps = {};
    for (const key in schema) {
        if (key === "__proto__")
            continue;
        const deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
        deps[key] = schema[key];
    }
    return [propertyDeps, schemaDeps];
}
function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
    const { gen, data, it } = cxt;
    if (Object.keys(propertyDeps).length === 0)
        return;
    const missing = gen.let("missing");
    for (const prop in propertyDeps) {
        const deps = propertyDeps[prop];
        if (deps.length === 0)
            continue;
        const hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
        cxt.setParams({
            property: prop,
            depsCount: deps.length,
            deps: deps.join(", "),
        });
        if (it.allErrors) {
            gen.if(hasProperty, () => {
                for (const depProp of deps) {
                    (0, code_1.checkReportMissingProp)(cxt, depProp);
                }
            });
        }
        else {
            gen.if((0, codegen_1._) `${hasProperty} && (${(0, code_1.checkMissingProp)(cxt, deps, missing)})`);
            (0, code_1.reportMissingProp)(cxt, missing);
            gen.else();
        }
    }
}
exports.validatePropertyDeps = validatePropertyDeps;
function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
    const { gen, data, keyword, it } = cxt;
    const valid = gen.name("valid");
    for (const prop in schemaDeps) {
        if ((0, util_1.alwaysValidSchema)(it, schemaDeps[prop]))
            continue;
        gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties), () => {
            const schCxt = cxt.subschema({ keyword, schemaProp: prop }, valid);
            cxt.mergeValidEvaluated(schCxt, valid);
        }, () => gen.var(valid, true) // TODO var
        );
        cxt.ok(valid);
    }
}
exports.validateSchemaDeps = validateSchemaDeps;
exports["default"] = def;
//# sourceMappingURL=dependencies.js.map

/***/ }),

/***/ 3818:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const dependencies_1 = __nccwpck_require__(5826);
const def = {
    keyword: "dependentSchemas",
    type: "object",
    schemaType: "object",
    code: (cxt) => (0, dependencies_1.validateSchemaDeps)(cxt),
};
exports["default"] = def;
//# sourceMappingURL=dependentSchemas.js.map

/***/ }),

/***/ 8584:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const error = {
    message: ({ params }) => (0, codegen_1.str) `must match "${params.ifClause}" schema`,
    params: ({ params }) => (0, codegen_1._) `{failingKeyword: ${params.ifClause}}`,
};
const def = {
    keyword: "if",
    schemaType: ["object", "boolean"],
    trackErrors: true,
    error,
    code(cxt) {
        const { gen, parentSchema, it } = cxt;
        if (parentSchema.then === undefined && parentSchema.else === undefined) {
            (0, util_1.checkStrictMode)(it, '"if" without "then" and "else" is ignored');
        }
        const hasThen = hasSchema(it, "then");
        const hasElse = hasSchema(it, "else");
        if (!hasThen && !hasElse)
            return;
        const valid = gen.let("valid", true);
        const schValid = gen.name("_valid");
        validateIf();
        cxt.reset();
        if (hasThen && hasElse) {
            const ifClause = gen.let("ifClause");
            cxt.setParams({ ifClause });
            gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
        }
        else if (hasThen) {
            gen.if(schValid, validateClause("then"));
        }
        else {
            gen.if((0, codegen_1.not)(schValid), validateClause("else"));
        }
        cxt.pass(valid, () => cxt.error(true));
        function validateIf() {
            const schCxt = cxt.subschema({
                keyword: "if",
                compositeRule: true,
                createErrors: false,
                allErrors: false,
            }, schValid);
            cxt.mergeEvaluated(schCxt);
        }
        function validateClause(keyword, ifClause) {
            return () => {
                const schCxt = cxt.subschema({ keyword }, schValid);
                gen.assign(valid, schValid);
                cxt.mergeValidEvaluated(schCxt, valid);
                if (ifClause)
                    gen.assign(ifClause, (0, codegen_1._) `${keyword}`);
                else
                    cxt.setParams({ ifClause: keyword });
            };
        }
    },
};
function hasSchema(it, keyword) {
    const schema = it.schema[keyword];
    return schema !== undefined && !(0, util_1.alwaysValidSchema)(it, schema);
}
exports["default"] = def;
//# sourceMappingURL=if.js.map

/***/ }),

/***/ 8775:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const additionalItems_1 = __nccwpck_require__(3448);
const prefixItems_1 = __nccwpck_require__(6467);
const items_1 = __nccwpck_require__(5791);
const items2020_1 = __nccwpck_require__(2959);
const contains_1 = __nccwpck_require__(6182);
const dependencies_1 = __nccwpck_require__(5826);
const propertyNames_1 = __nccwpck_require__(1372);
const additionalProperties_1 = __nccwpck_require__(2431);
const properties_1 = __nccwpck_require__(8778);
const patternProperties_1 = __nccwpck_require__(664);
const not_1 = __nccwpck_require__(8350);
const anyOf_1 = __nccwpck_require__(9380);
const oneOf_1 = __nccwpck_require__(2490);
const allOf_1 = __nccwpck_require__(9205);
const if_1 = __nccwpck_require__(8584);
const thenElse_1 = __nccwpck_require__(6829);
function getApplicator(draft2020 = false) {
    const applicator = [
        // any
        not_1.default,
        anyOf_1.default,
        oneOf_1.default,
        allOf_1.default,
        if_1.default,
        thenElse_1.default,
        // object
        propertyNames_1.default,
        additionalProperties_1.default,
        dependencies_1.default,
        properties_1.default,
        patternProperties_1.default,
    ];
    // array
    if (draft2020)
        applicator.push(prefixItems_1.default, items2020_1.default);
    else
        applicator.push(additionalItems_1.default, items_1.default);
    applicator.push(contains_1.default);
    return applicator;
}
exports["default"] = getApplicator;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 5791:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateTuple = void 0;
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const code_1 = __nccwpck_require__(8484);
const def = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "array", "boolean"],
    before: "uniqueItems",
    code(cxt) {
        const { schema, it } = cxt;
        if (Array.isArray(schema))
            return validateTuple(cxt, "additionalItems", schema);
        it.items = true;
        if ((0, util_1.alwaysValidSchema)(it, schema))
            return;
        cxt.ok((0, code_1.validateArray)(cxt));
    },
};
function validateTuple(cxt, extraItems, schArr = cxt.schema) {
    const { gen, parentSchema, data, keyword, it } = cxt;
    checkStrictTuple(parentSchema);
    if (it.opts.unevaluated && schArr.length && it.items !== true) {
        it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items);
    }
    const valid = gen.name("valid");
    const len = gen.const("len", (0, codegen_1._) `${data}.length`);
    schArr.forEach((sch, i) => {
        if ((0, util_1.alwaysValidSchema)(it, sch))
            return;
        gen.if((0, codegen_1._) `${len} > ${i}`, () => cxt.subschema({
            keyword,
            schemaProp: i,
            dataProp: i,
        }, valid));
        cxt.ok(valid);
    });
    function checkStrictTuple(sch) {
        const { opts, errSchemaPath } = it;
        const l = schArr.length;
        const fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
        if (opts.strictTuples && !fullTuple) {
            const msg = `"${keyword}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
            (0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
        }
    }
}
exports.validateTuple = validateTuple;
exports["default"] = def;
//# sourceMappingURL=items.js.map

/***/ }),

/***/ 2959:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const code_1 = __nccwpck_require__(8484);
const additionalItems_1 = __nccwpck_require__(3448);
const error = {
    message: ({ params: { len } }) => (0, codegen_1.str) `must NOT have more than ${len} items`,
    params: ({ params: { len } }) => (0, codegen_1._) `{limit: ${len}}`,
};
const def = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    error,
    code(cxt) {
        const { schema, parentSchema, it } = cxt;
        const { prefixItems } = parentSchema;
        it.items = true;
        if ((0, util_1.alwaysValidSchema)(it, schema))
            return;
        if (prefixItems)
            (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems);
        else
            cxt.ok((0, code_1.validateArray)(cxt));
    },
};
exports["default"] = def;
//# sourceMappingURL=items2020.js.map

/***/ }),

/***/ 8350:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const util_1 = __nccwpck_require__(4464);
const def = {
    keyword: "not",
    schemaType: ["object", "boolean"],
    trackErrors: true,
    code(cxt) {
        const { gen, schema, it } = cxt;
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
            cxt.fail();
            return;
        }
        const valid = gen.name("valid");
        cxt.subschema({
            keyword: "not",
            compositeRule: true,
            createErrors: false,
            allErrors: false,
        }, valid);
        cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
    },
    error: { message: "must NOT be valid" },
};
exports["default"] = def;
//# sourceMappingURL=not.js.map

/***/ }),

/***/ 2490:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const error = {
    message: "must match exactly one schema in oneOf",
    params: ({ params }) => (0, codegen_1._) `{passingSchemas: ${params.passing}}`,
};
const def = {
    keyword: "oneOf",
    schemaType: "array",
    trackErrors: true,
    error,
    code(cxt) {
        const { gen, schema, parentSchema, it } = cxt;
        /* istanbul ignore if */
        if (!Array.isArray(schema))
            throw new Error("ajv implementation error");
        if (it.opts.discriminator && parentSchema.discriminator)
            return;
        const schArr = schema;
        const valid = gen.let("valid", false);
        const passing = gen.let("passing", null);
        const schValid = gen.name("_valid");
        cxt.setParams({ passing });
        // TODO possibly fail straight away (with warning or exception) if there are two empty always valid schemas
        gen.block(validateOneOf);
        cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
        function validateOneOf() {
            schArr.forEach((sch, i) => {
                let schCxt;
                if ((0, util_1.alwaysValidSchema)(it, sch)) {
                    gen.var(schValid, true);
                }
                else {
                    schCxt = cxt.subschema({
                        keyword: "oneOf",
                        schemaProp: i,
                        compositeRule: true,
                    }, schValid);
                }
                if (i > 0) {
                    gen
                        .if((0, codegen_1._) `${schValid} && ${valid}`)
                        .assign(valid, false)
                        .assign(passing, (0, codegen_1._) `[${passing}, ${i}]`)
                        .else();
                }
                gen.if(schValid, () => {
                    gen.assign(valid, true);
                    gen.assign(passing, i);
                    if (schCxt)
                        cxt.mergeEvaluated(schCxt, codegen_1.Name);
                });
            });
        }
    },
};
exports["default"] = def;
//# sourceMappingURL=oneOf.js.map

/***/ }),

/***/ 664:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const code_1 = __nccwpck_require__(8484);
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const util_2 = __nccwpck_require__(4464);
const def = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code(cxt) {
        const { gen, schema, data, parentSchema, it } = cxt;
        const { opts } = it;
        const patterns = (0, code_1.allSchemaProperties)(schema);
        const alwaysValidPatterns = patterns.filter((p) => (0, util_1.alwaysValidSchema)(it, schema[p]));
        if (patterns.length === 0 ||
            (alwaysValidPatterns.length === patterns.length &&
                (!it.opts.unevaluated || it.props === true))) {
            return;
        }
        const checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
        const valid = gen.name("valid");
        if (it.props !== true && !(it.props instanceof codegen_1.Name)) {
            it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
        }
        const { props } = it;
        validatePatternProperties();
        function validatePatternProperties() {
            for (const pat of patterns) {
                if (checkProperties)
                    checkMatchingProperties(pat);
                if (it.allErrors) {
                    validateProperties(pat);
                }
                else {
                    gen.var(valid, true); // TODO var
                    validateProperties(pat);
                    gen.if(valid);
                }
            }
        }
        function checkMatchingProperties(pat) {
            for (const prop in checkProperties) {
                if (new RegExp(pat).test(prop)) {
                    (0, util_1.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
                }
            }
        }
        function validateProperties(pat) {
            gen.forIn("key", data, (key) => {
                gen.if((0, codegen_1._) `${(0, code_1.usePattern)(cxt, pat)}.test(${key})`, () => {
                    const alwaysValid = alwaysValidPatterns.includes(pat);
                    if (!alwaysValid) {
                        cxt.subschema({
                            keyword: "patternProperties",
                            schemaProp: pat,
                            dataProp: key,
                            dataPropType: util_2.Type.Str,
                        }, valid);
                    }
                    if (it.opts.unevaluated && props !== true) {
                        gen.assign((0, codegen_1._) `${props}[${key}]`, true);
                    }
                    else if (!alwaysValid && !it.allErrors) {
                        // can short-circuit if `unevaluatedProperties` is not supported (opts.next === false)
                        // or if all properties were evaluated (props === true)
                        gen.if((0, codegen_1.not)(valid), () => gen.break());
                    }
                });
            });
        }
    },
};
exports["default"] = def;
//# sourceMappingURL=patternProperties.js.map

/***/ }),

/***/ 6467:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const items_1 = __nccwpck_require__(5791);
const def = {
    keyword: "prefixItems",
    type: "array",
    schemaType: ["array"],
    before: "uniqueItems",
    code: (cxt) => (0, items_1.validateTuple)(cxt, "items"),
};
exports["default"] = def;
//# sourceMappingURL=prefixItems.js.map

/***/ }),

/***/ 8778:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const validate_1 = __nccwpck_require__(7881);
const code_1 = __nccwpck_require__(8484);
const util_1 = __nccwpck_require__(4464);
const additionalProperties_1 = __nccwpck_require__(2431);
const def = {
    keyword: "properties",
    type: "object",
    schemaType: "object",
    code(cxt) {
        const { gen, schema, parentSchema, data, it } = cxt;
        if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === undefined) {
            additionalProperties_1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1.default, "additionalProperties"));
        }
        const allProps = (0, code_1.allSchemaProperties)(schema);
        for (const prop of allProps) {
            it.definedProperties.add(prop);
        }
        if (it.opts.unevaluated && allProps.length && it.props !== true) {
            it.props = util_1.mergeEvaluated.props(gen, (0, util_1.toHash)(allProps), it.props);
        }
        const properties = allProps.filter((p) => !(0, util_1.alwaysValidSchema)(it, schema[p]));
        if (properties.length === 0)
            return;
        const valid = gen.name("valid");
        for (const prop of properties) {
            if (hasDefault(prop)) {
                applyPropertySchema(prop);
            }
            else {
                gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties));
                applyPropertySchema(prop);
                if (!it.allErrors)
                    gen.else().var(valid, true);
                gen.endIf();
            }
            cxt.it.definedProperties.add(prop);
            cxt.ok(valid);
        }
        function hasDefault(prop) {
            return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== undefined;
        }
        function applyPropertySchema(prop) {
            cxt.subschema({
                keyword: "properties",
                schemaProp: prop,
                dataProp: prop,
            }, valid);
        }
    },
};
exports["default"] = def;
//# sourceMappingURL=properties.js.map

/***/ }),

/***/ 1372:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const error = {
    message: "property name must be valid",
    params: ({ params }) => (0, codegen_1._) `{propertyName: ${params.propertyName}}`,
};
const def = {
    keyword: "propertyNames",
    type: "object",
    schemaType: ["object", "boolean"],
    error,
    code(cxt) {
        const { gen, schema, data, it } = cxt;
        if ((0, util_1.alwaysValidSchema)(it, schema))
            return;
        const valid = gen.name("valid");
        gen.forIn("key", data, (key) => {
            cxt.setParams({ propertyName: key });
            cxt.subschema({
                keyword: "propertyNames",
                data: key,
                dataTypes: ["string"],
                propertyName: key,
                compositeRule: true,
            }, valid);
            gen.if((0, codegen_1.not)(valid), () => {
                cxt.error(true);
                if (!it.allErrors)
                    gen.break();
            });
        });
        cxt.ok(valid);
    },
};
exports["default"] = def;
//# sourceMappingURL=propertyNames.js.map

/***/ }),

/***/ 6829:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const util_1 = __nccwpck_require__(4464);
const def = {
    keyword: ["then", "else"],
    schemaType: ["object", "boolean"],
    code({ keyword, parentSchema, it }) {
        if (parentSchema.if === undefined)
            (0, util_1.checkStrictMode)(it, `"${keyword}" without "if" is ignored`);
    },
};
exports["default"] = def;
//# sourceMappingURL=thenElse.js.map

/***/ }),

/***/ 8484:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateUnion = exports.validateArray = exports.usePattern = exports.callValidateCode = exports.schemaProperties = exports.allSchemaProperties = exports.noPropertyInData = exports.propertyInData = exports.isOwnProperty = exports.hasPropFunc = exports.reportMissingProp = exports.checkMissingProp = exports.checkReportMissingProp = void 0;
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const names_1 = __nccwpck_require__(630);
const util_2 = __nccwpck_require__(4464);
function checkReportMissingProp(cxt, prop) {
    const { gen, data, it } = cxt;
    gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
        cxt.setParams({ missingProperty: (0, codegen_1._) `${prop}` }, true);
        cxt.error();
    });
}
exports.checkReportMissingProp = checkReportMissingProp;
function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
    return (0, codegen_1.or)(...properties.map((prop) => (0, codegen_1.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1._) `${missing} = ${prop}`)));
}
exports.checkMissingProp = checkMissingProp;
function reportMissingProp(cxt, missing) {
    cxt.setParams({ missingProperty: missing }, true);
    cxt.error();
}
exports.reportMissingProp = reportMissingProp;
function hasPropFunc(gen) {
    return gen.scopeValue("func", {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        ref: Object.prototype.hasOwnProperty,
        code: (0, codegen_1._) `Object.prototype.hasOwnProperty`,
    });
}
exports.hasPropFunc = hasPropFunc;
function isOwnProperty(gen, data, property) {
    return (0, codegen_1._) `${hasPropFunc(gen)}.call(${data}, ${property})`;
}
exports.isOwnProperty = isOwnProperty;
function propertyInData(gen, data, property, ownProperties) {
    const cond = (0, codegen_1._) `${data}${(0, codegen_1.getProperty)(property)} !== undefined`;
    return ownProperties ? (0, codegen_1._) `${cond} && ${isOwnProperty(gen, data, property)}` : cond;
}
exports.propertyInData = propertyInData;
function noPropertyInData(gen, data, property, ownProperties) {
    const cond = (0, codegen_1._) `${data}${(0, codegen_1.getProperty)(property)} === undefined`;
    return ownProperties ? (0, codegen_1.or)(cond, (0, codegen_1.not)(isOwnProperty(gen, data, property))) : cond;
}
exports.noPropertyInData = noPropertyInData;
function allSchemaProperties(schemaMap) {
    return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
}
exports.allSchemaProperties = allSchemaProperties;
function schemaProperties(it, schemaMap) {
    return allSchemaProperties(schemaMap).filter((p) => !(0, util_1.alwaysValidSchema)(it, schemaMap[p]));
}
exports.schemaProperties = schemaProperties;
function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
    const dataAndSchema = passSchema ? (0, codegen_1._) `${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
    const valCxt = [
        [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, errorPath)],
        [names_1.default.parentData, it.parentData],
        [names_1.default.parentDataProperty, it.parentDataProperty],
        [names_1.default.rootData, names_1.default.rootData],
    ];
    if (it.opts.dynamicRef)
        valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
    const args = (0, codegen_1._) `${dataAndSchema}, ${gen.object(...valCxt)}`;
    return context !== codegen_1.nil ? (0, codegen_1._) `${func}.call(${context}, ${args})` : (0, codegen_1._) `${func}(${args})`;
}
exports.callValidateCode = callValidateCode;
const newRegExp = (0, codegen_1._) `new RegExp`;
function usePattern({ gen, it: { opts } }, pattern) {
    const u = opts.unicodeRegExp ? "u" : "";
    const { regExp } = opts.code;
    const rx = regExp(pattern, u);
    return gen.scopeValue("pattern", {
        key: rx.toString(),
        ref: rx,
        code: (0, codegen_1._) `${regExp.code === "new RegExp" ? newRegExp : (0, util_2.useFunc)(gen, regExp)}(${pattern}, ${u})`,
    });
}
exports.usePattern = usePattern;
function validateArray(cxt) {
    const { gen, data, keyword, it } = cxt;
    const valid = gen.name("valid");
    if (it.allErrors) {
        const validArr = gen.let("valid", true);
        validateItems(() => gen.assign(validArr, false));
        return validArr;
    }
    gen.var(valid, true);
    validateItems(() => gen.break());
    return valid;
    function validateItems(notValid) {
        const len = gen.const("len", (0, codegen_1._) `${data}.length`);
        gen.forRange("i", 0, len, (i) => {
            cxt.subschema({
                keyword,
                dataProp: i,
                dataPropType: util_1.Type.Num,
            }, valid);
            gen.if((0, codegen_1.not)(valid), notValid);
        });
    }
}
exports.validateArray = validateArray;
function validateUnion(cxt) {
    const { gen, schema, keyword, it } = cxt;
    /* istanbul ignore if */
    if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
    const alwaysValid = schema.some((sch) => (0, util_1.alwaysValidSchema)(it, sch));
    if (alwaysValid && !it.opts.unevaluated)
        return;
    const valid = gen.let("valid", false);
    const schValid = gen.name("_valid");
    gen.block(() => schema.forEach((_sch, i) => {
        const schCxt = cxt.subschema({
            keyword,
            schemaProp: i,
            compositeRule: true,
        }, schValid);
        gen.assign(valid, (0, codegen_1._) `${valid} || ${schValid}`);
        const merged = cxt.mergeValidEvaluated(schCxt, schValid);
        // can short-circuit if `unevaluatedProperties/Items` not supported (opts.unevaluated !== true)
        // or if all properties and items were evaluated (it.props === true && it.items === true)
        if (!merged)
            gen.if((0, codegen_1.not)(valid));
    }));
    cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
}
exports.validateUnion = validateUnion;
//# sourceMappingURL=code.js.map

/***/ }),

/***/ 9872:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const def = {
    keyword: "id",
    code() {
        throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
    },
};
exports["default"] = def;
//# sourceMappingURL=id.js.map

/***/ }),

/***/ 7397:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const id_1 = __nccwpck_require__(9872);
const ref_1 = __nccwpck_require__(2996);
const core = [
    "$schema",
    "$id",
    "$defs",
    "$vocabulary",
    { keyword: "$comment" },
    "definitions",
    id_1.default,
    ref_1.default,
];
exports["default"] = core;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 2996:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.callRef = exports.getValidate = void 0;
const ref_error_1 = __nccwpck_require__(3162);
const code_1 = __nccwpck_require__(8484);
const codegen_1 = __nccwpck_require__(1436);
const names_1 = __nccwpck_require__(630);
const compile_1 = __nccwpck_require__(2718);
const util_1 = __nccwpck_require__(4464);
const def = {
    keyword: "$ref",
    schemaType: "string",
    code(cxt) {
        const { gen, schema: $ref, it } = cxt;
        const { baseId, schemaEnv: env, validateName, opts, self } = it;
        const { root } = env;
        if (($ref === "#" || $ref === "#/") && baseId === root.baseId)
            return callRootRef();
        const schOrEnv = compile_1.resolveRef.call(self, root, baseId, $ref);
        if (schOrEnv === undefined)
            throw new ref_error_1.default(it.opts.uriResolver, baseId, $ref);
        if (schOrEnv instanceof compile_1.SchemaEnv)
            return callValidate(schOrEnv);
        return inlineRefSchema(schOrEnv);
        function callRootRef() {
            if (env === root)
                return callRef(cxt, validateName, env, env.$async);
            const rootName = gen.scopeValue("root", { ref: root });
            return callRef(cxt, (0, codegen_1._) `${rootName}.validate`, root, root.$async);
        }
        function callValidate(sch) {
            const v = getValidate(cxt, sch);
            callRef(cxt, v, sch, sch.$async);
        }
        function inlineRefSchema(sch) {
            const schName = gen.scopeValue("schema", opts.code.source === true ? { ref: sch, code: (0, codegen_1.stringify)(sch) } : { ref: sch });
            const valid = gen.name("valid");
            const schCxt = cxt.subschema({
                schema: sch,
                dataTypes: [],
                schemaPath: codegen_1.nil,
                topSchemaRef: schName,
                errSchemaPath: $ref,
            }, valid);
            cxt.mergeEvaluated(schCxt);
            cxt.ok(valid);
        }
    },
};
function getValidate(cxt, sch) {
    const { gen } = cxt;
    return sch.validate
        ? gen.scopeValue("validate", { ref: sch.validate })
        : (0, codegen_1._) `${gen.scopeValue("wrapper", { ref: sch })}.validate`;
}
exports.getValidate = getValidate;
function callRef(cxt, v, sch, $async) {
    const { gen, it } = cxt;
    const { allErrors, schemaEnv: env, opts } = it;
    const passCxt = opts.passContext ? names_1.default.this : codegen_1.nil;
    if ($async)
        callAsyncRef();
    else
        callSyncRef();
    function callAsyncRef() {
        if (!env.$async)
            throw new Error("async schema referenced by sync schema");
        const valid = gen.let("valid");
        gen.try(() => {
            gen.code((0, codegen_1._) `await ${(0, code_1.callValidateCode)(cxt, v, passCxt)}`);
            addEvaluatedFrom(v); // TODO will not work with async, it has to be returned with the result
            if (!allErrors)
                gen.assign(valid, true);
        }, (e) => {
            gen.if((0, codegen_1._) `!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
            addErrorsFrom(e);
            if (!allErrors)
                gen.assign(valid, false);
        });
        cxt.ok(valid);
    }
    function callSyncRef() {
        cxt.result((0, code_1.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
    }
    function addErrorsFrom(source) {
        const errs = (0, codegen_1._) `${source}.errors`;
        gen.assign(names_1.default.vErrors, (0, codegen_1._) `${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`); // TODO tagged
        gen.assign(names_1.default.errors, (0, codegen_1._) `${names_1.default.vErrors}.length`);
    }
    function addEvaluatedFrom(source) {
        var _a;
        if (!it.opts.unevaluated)
            return;
        const schEvaluated = (_a = sch === null || sch === void 0 ? void 0 : sch.validate) === null || _a === void 0 ? void 0 : _a.evaluated;
        // TODO refactor
        if (it.props !== true) {
            if (schEvaluated && !schEvaluated.dynamicProps) {
                if (schEvaluated.props !== undefined) {
                    it.props = util_1.mergeEvaluated.props(gen, schEvaluated.props, it.props);
                }
            }
            else {
                const props = gen.var("props", (0, codegen_1._) `${source}.evaluated.props`);
                it.props = util_1.mergeEvaluated.props(gen, props, it.props, codegen_1.Name);
            }
        }
        if (it.items !== true) {
            if (schEvaluated && !schEvaluated.dynamicItems) {
                if (schEvaluated.items !== undefined) {
                    it.items = util_1.mergeEvaluated.items(gen, schEvaluated.items, it.items);
                }
            }
            else {
                const items = gen.var("items", (0, codegen_1._) `${source}.evaluated.items`);
                it.items = util_1.mergeEvaluated.items(gen, items, it.items, codegen_1.Name);
            }
        }
    }
}
exports.callRef = callRef;
exports["default"] = def;
//# sourceMappingURL=ref.js.map

/***/ }),

/***/ 8886:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const types_1 = __nccwpck_require__(7115);
const compile_1 = __nccwpck_require__(2718);
const ref_error_1 = __nccwpck_require__(3162);
const util_1 = __nccwpck_require__(4464);
const error = {
    message: ({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag
        ? `tag "${tagName}" must be string`
        : `value of tag "${tagName}" must be in oneOf`,
    params: ({ params: { discrError, tag, tagName } }) => (0, codegen_1._) `{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`,
};
const def = {
    keyword: "discriminator",
    type: "object",
    schemaType: "object",
    error,
    code(cxt) {
        const { gen, data, schema, parentSchema, it } = cxt;
        const { oneOf } = parentSchema;
        if (!it.opts.discriminator) {
            throw new Error("discriminator: requires discriminator option");
        }
        const tagName = schema.propertyName;
        if (typeof tagName != "string")
            throw new Error("discriminator: requires propertyName");
        if (schema.mapping)
            throw new Error("discriminator: mapping is not supported");
        if (!oneOf)
            throw new Error("discriminator: requires oneOf keyword");
        const valid = gen.let("valid", false);
        const tag = gen.const("tag", (0, codegen_1._) `${data}${(0, codegen_1.getProperty)(tagName)}`);
        gen.if((0, codegen_1._) `typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(false, { discrError: types_1.DiscrError.Tag, tag, tagName }));
        cxt.ok(valid);
        function validateMapping() {
            const mapping = getMapping();
            gen.if(false);
            for (const tagValue in mapping) {
                gen.elseIf((0, codegen_1._) `${tag} === ${tagValue}`);
                gen.assign(valid, applyTagSchema(mapping[tagValue]));
            }
            gen.else();
            cxt.error(false, { discrError: types_1.DiscrError.Mapping, tag, tagName });
            gen.endIf();
        }
        function applyTagSchema(schemaProp) {
            const _valid = gen.name("valid");
            const schCxt = cxt.subschema({ keyword: "oneOf", schemaProp }, _valid);
            cxt.mergeEvaluated(schCxt, codegen_1.Name);
            return _valid;
        }
        function getMapping() {
            var _a;
            const oneOfMapping = {};
            const topRequired = hasRequired(parentSchema);
            let tagRequired = true;
            for (let i = 0; i < oneOf.length; i++) {
                let sch = oneOf[i];
                if ((sch === null || sch === void 0 ? void 0 : sch.$ref) && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
                    const ref = sch.$ref;
                    sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref);
                    if (sch instanceof compile_1.SchemaEnv)
                        sch = sch.schema;
                    if (sch === undefined)
                        throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref);
                }
                const propSch = (_a = sch === null || sch === void 0 ? void 0 : sch.properties) === null || _a === void 0 ? void 0 : _a[tagName];
                if (typeof propSch != "object") {
                    throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
                }
                tagRequired = tagRequired && (topRequired || hasRequired(sch));
                addMappings(propSch, i);
            }
            if (!tagRequired)
                throw new Error(`discriminator: "${tagName}" must be required`);
            return oneOfMapping;
            function hasRequired({ required }) {
                return Array.isArray(required) && required.includes(tagName);
            }
            function addMappings(sch, i) {
                if (sch.const) {
                    addMapping(sch.const, i);
                }
                else if (sch.enum) {
                    for (const tagValue of sch.enum) {
                        addMapping(tagValue, i);
                    }
                }
                else {
                    throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
                }
            }
            function addMapping(tagValue, i) {
                if (typeof tagValue != "string" || tagValue in oneOfMapping) {
                    throw new Error(`discriminator: "${tagName}" values must be unique strings`);
                }
                oneOfMapping[tagValue] = i;
            }
        }
    },
};
exports["default"] = def;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 7115:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DiscrError = void 0;
var DiscrError;
(function (DiscrError) {
    DiscrError["Tag"] = "tag";
    DiscrError["Mapping"] = "mapping";
})(DiscrError || (exports.DiscrError = DiscrError = {}));
//# sourceMappingURL=types.js.map

/***/ }),

/***/ 4298:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __nccwpck_require__(7397);
const validation_1 = __nccwpck_require__(5481);
const applicator_1 = __nccwpck_require__(8775);
const dynamic_1 = __nccwpck_require__(9923);
const next_1 = __nccwpck_require__(7844);
const unevaluated_1 = __nccwpck_require__(2010);
const format_1 = __nccwpck_require__(2601);
const metadata_1 = __nccwpck_require__(6620);
const draft2020Vocabularies = [
    dynamic_1.default,
    core_1.default,
    validation_1.default,
    (0, applicator_1.default)(true),
    format_1.default,
    metadata_1.metadataVocabulary,
    metadata_1.contentVocabulary,
    next_1.default,
    unevaluated_1.default,
];
exports["default"] = draft2020Vocabularies;
//# sourceMappingURL=draft2020.js.map

/***/ }),

/***/ 8639:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.dynamicAnchor = void 0;
const codegen_1 = __nccwpck_require__(1436);
const names_1 = __nccwpck_require__(630);
const compile_1 = __nccwpck_require__(2718);
const ref_1 = __nccwpck_require__(2996);
const def = {
    keyword: "$dynamicAnchor",
    schemaType: "string",
    code: (cxt) => dynamicAnchor(cxt, cxt.schema),
};
function dynamicAnchor(cxt, anchor) {
    const { gen, it } = cxt;
    it.schemaEnv.root.dynamicAnchors[anchor] = true;
    const v = (0, codegen_1._) `${names_1.default.dynamicAnchors}${(0, codegen_1.getProperty)(anchor)}`;
    const validate = it.errSchemaPath === "#" ? it.validateName : _getValidate(cxt);
    gen.if((0, codegen_1._) `!${v}`, () => gen.assign(v, validate));
}
exports.dynamicAnchor = dynamicAnchor;
function _getValidate(cxt) {
    const { schemaEnv, schema, self } = cxt.it;
    const { root, baseId, localRefs, meta } = schemaEnv.root;
    const { schemaId } = self.opts;
    const sch = new compile_1.SchemaEnv({ schema, schemaId, root, baseId, localRefs, meta });
    compile_1.compileSchema.call(self, sch);
    return (0, ref_1.getValidate)(cxt, sch);
}
exports["default"] = def;
//# sourceMappingURL=dynamicAnchor.js.map

/***/ }),

/***/ 5065:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.dynamicRef = void 0;
const codegen_1 = __nccwpck_require__(1436);
const names_1 = __nccwpck_require__(630);
const ref_1 = __nccwpck_require__(2996);
const def = {
    keyword: "$dynamicRef",
    schemaType: "string",
    code: (cxt) => dynamicRef(cxt, cxt.schema),
};
function dynamicRef(cxt, ref) {
    const { gen, keyword, it } = cxt;
    if (ref[0] !== "#")
        throw new Error(`"${keyword}" only supports hash fragment reference`);
    const anchor = ref.slice(1);
    if (it.allErrors) {
        _dynamicRef();
    }
    else {
        const valid = gen.let("valid", false);
        _dynamicRef(valid);
        cxt.ok(valid);
    }
    function _dynamicRef(valid) {
        // TODO the assumption here is that `recursiveRef: #` always points to the root
        // of the schema object, which is not correct, because there may be $id that
        // makes # point to it, and the target schema may not contain dynamic/recursiveAnchor.
        // Because of that 2 tests in recursiveRef.json fail.
        // This is a similar problem to #815 (`$id` doesn't alter resolution scope for `{ "$ref": "#" }`).
        // (This problem is not tested in JSON-Schema-Test-Suite)
        if (it.schemaEnv.root.dynamicAnchors[anchor]) {
            const v = gen.let("_v", (0, codegen_1._) `${names_1.default.dynamicAnchors}${(0, codegen_1.getProperty)(anchor)}`);
            gen.if(v, _callRef(v, valid), _callRef(it.validateName, valid));
        }
        else {
            _callRef(it.validateName, valid)();
        }
    }
    function _callRef(validate, valid) {
        return valid
            ? () => gen.block(() => {
                (0, ref_1.callRef)(cxt, validate);
                gen.let(valid, true);
            })
            : () => (0, ref_1.callRef)(cxt, validate);
    }
}
exports.dynamicRef = dynamicRef;
exports["default"] = def;
//# sourceMappingURL=dynamicRef.js.map

/***/ }),

/***/ 9923:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const dynamicAnchor_1 = __nccwpck_require__(8639);
const dynamicRef_1 = __nccwpck_require__(5065);
const recursiveAnchor_1 = __nccwpck_require__(9982);
const recursiveRef_1 = __nccwpck_require__(1794);
const dynamic = [dynamicAnchor_1.default, dynamicRef_1.default, recursiveAnchor_1.default, recursiveRef_1.default];
exports["default"] = dynamic;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 9982:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const dynamicAnchor_1 = __nccwpck_require__(8639);
const util_1 = __nccwpck_require__(4464);
const def = {
    keyword: "$recursiveAnchor",
    schemaType: "boolean",
    code(cxt) {
        if (cxt.schema)
            (0, dynamicAnchor_1.dynamicAnchor)(cxt, "");
        else
            (0, util_1.checkStrictMode)(cxt.it, "$recursiveAnchor: false is ignored");
    },
};
exports["default"] = def;
//# sourceMappingURL=recursiveAnchor.js.map

/***/ }),

/***/ 1794:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const dynamicRef_1 = __nccwpck_require__(5065);
const def = {
    keyword: "$recursiveRef",
    schemaType: "string",
    code: (cxt) => (0, dynamicRef_1.dynamicRef)(cxt, cxt.schema),
};
exports["default"] = def;
//# sourceMappingURL=recursiveRef.js.map

/***/ }),

/***/ 6402:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const error = {
    message: ({ schemaCode }) => (0, codegen_1.str) `must match format "${schemaCode}"`,
    params: ({ schemaCode }) => (0, codegen_1._) `{format: ${schemaCode}}`,
};
const def = {
    keyword: "format",
    type: ["number", "string"],
    schemaType: "string",
    $data: true,
    error,
    code(cxt, ruleType) {
        const { gen, data, $data, schema, schemaCode, it } = cxt;
        const { opts, errSchemaPath, schemaEnv, self } = it;
        if (!opts.validateFormats)
            return;
        if ($data)
            validate$DataFormat();
        else
            validateFormat();
        function validate$DataFormat() {
            const fmts = gen.scopeValue("formats", {
                ref: self.formats,
                code: opts.code.formats,
            });
            const fDef = gen.const("fDef", (0, codegen_1._) `${fmts}[${schemaCode}]`);
            const fType = gen.let("fType");
            const format = gen.let("format");
            // TODO simplify
            gen.if((0, codegen_1._) `typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1._) `${fDef}.type || "string"`).assign(format, (0, codegen_1._) `${fDef}.validate`), () => gen.assign(fType, (0, codegen_1._) `"string"`).assign(format, fDef));
            cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
            function unknownFmt() {
                if (opts.strictSchema === false)
                    return codegen_1.nil;
                return (0, codegen_1._) `${schemaCode} && !${format}`;
            }
            function invalidFmt() {
                const callFormat = schemaEnv.$async
                    ? (0, codegen_1._) `(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))`
                    : (0, codegen_1._) `${format}(${data})`;
                const validData = (0, codegen_1._) `(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
                return (0, codegen_1._) `${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
            }
        }
        function validateFormat() {
            const formatDef = self.formats[schema];
            if (!formatDef) {
                unknownFormat();
                return;
            }
            if (formatDef === true)
                return;
            const [fmtType, format, fmtRef] = getFormat(formatDef);
            if (fmtType === ruleType)
                cxt.pass(validCondition());
            function unknownFormat() {
                if (opts.strictSchema === false) {
                    self.logger.warn(unknownMsg());
                    return;
                }
                throw new Error(unknownMsg());
                function unknownMsg() {
                    return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
                }
            }
            function getFormat(fmtDef) {
                const code = fmtDef instanceof RegExp
                    ? (0, codegen_1.regexpCode)(fmtDef)
                    : opts.code.formats
                        ? (0, codegen_1._) `${opts.code.formats}${(0, codegen_1.getProperty)(schema)}`
                        : undefined;
                const fmt = gen.scopeValue("formats", { key: schema, ref: fmtDef, code });
                if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
                    return [fmtDef.type || "string", fmtDef.validate, (0, codegen_1._) `${fmt}.validate`];
                }
                return ["string", fmtDef, fmt];
            }
            function validCondition() {
                if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
                    if (!schemaEnv.$async)
                        throw new Error("async format in sync schema");
                    return (0, codegen_1._) `await ${fmtRef}(${data})`;
                }
                return typeof format == "function" ? (0, codegen_1._) `${fmtRef}(${data})` : (0, codegen_1._) `${fmtRef}.test(${data})`;
            }
        }
    },
};
exports["default"] = def;
//# sourceMappingURL=format.js.map

/***/ }),

/***/ 2601:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const format_1 = __nccwpck_require__(6402);
const format = [format_1.default];
exports["default"] = format;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 6620:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.contentVocabulary = exports.metadataVocabulary = void 0;
exports.metadataVocabulary = [
    "title",
    "description",
    "default",
    "deprecated",
    "readOnly",
    "writeOnly",
    "examples",
];
exports.contentVocabulary = [
    "contentMediaType",
    "contentEncoding",
    "contentSchema",
];
//# sourceMappingURL=metadata.js.map

/***/ }),

/***/ 7844:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const dependentRequired_1 = __nccwpck_require__(643);
const dependentSchemas_1 = __nccwpck_require__(3818);
const limitContains_1 = __nccwpck_require__(3907);
const next = [dependentRequired_1.default, dependentSchemas_1.default, limitContains_1.default];
exports["default"] = next;
//# sourceMappingURL=next.js.map

/***/ }),

/***/ 2010:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const unevaluatedProperties_1 = __nccwpck_require__(6855);
const unevaluatedItems_1 = __nccwpck_require__(4144);
const unevaluated = [unevaluatedProperties_1.default, unevaluatedItems_1.default];
exports["default"] = unevaluated;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 4144:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const error = {
    message: ({ params: { len } }) => (0, codegen_1.str) `must NOT have more than ${len} items`,
    params: ({ params: { len } }) => (0, codegen_1._) `{limit: ${len}}`,
};
const def = {
    keyword: "unevaluatedItems",
    type: "array",
    schemaType: ["boolean", "object"],
    error,
    code(cxt) {
        const { gen, schema, data, it } = cxt;
        const items = it.items || 0;
        if (items === true)
            return;
        const len = gen.const("len", (0, codegen_1._) `${data}.length`);
        if (schema === false) {
            cxt.setParams({ len: items });
            cxt.fail((0, codegen_1._) `${len} > ${items}`);
        }
        else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
            const valid = gen.var("valid", (0, codegen_1._) `${len} <= ${items}`);
            gen.if((0, codegen_1.not)(valid), () => validateItems(valid, items));
            cxt.ok(valid);
        }
        it.items = true;
        function validateItems(valid, from) {
            gen.forRange("i", from, len, (i) => {
                cxt.subschema({ keyword: "unevaluatedItems", dataProp: i, dataPropType: util_1.Type.Num }, valid);
                if (!it.allErrors)
                    gen.if((0, codegen_1.not)(valid), () => gen.break());
            });
        }
    },
};
exports["default"] = def;
//# sourceMappingURL=unevaluatedItems.js.map

/***/ }),

/***/ 6855:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const names_1 = __nccwpck_require__(630);
const error = {
    message: "must NOT have unevaluated properties",
    params: ({ params }) => (0, codegen_1._) `{unevaluatedProperty: ${params.unevaluatedProperty}}`,
};
const def = {
    keyword: "unevaluatedProperties",
    type: "object",
    schemaType: ["boolean", "object"],
    trackErrors: true,
    error,
    code(cxt) {
        const { gen, schema, data, errsCount, it } = cxt;
        /* istanbul ignore if */
        if (!errsCount)
            throw new Error("ajv implementation error");
        const { allErrors, props } = it;
        if (props instanceof codegen_1.Name) {
            gen.if((0, codegen_1._) `${props} !== true`, () => gen.forIn("key", data, (key) => gen.if(unevaluatedDynamic(props, key), () => unevaluatedPropCode(key))));
        }
        else if (props !== true) {
            gen.forIn("key", data, (key) => props === undefined
                ? unevaluatedPropCode(key)
                : gen.if(unevaluatedStatic(props, key), () => unevaluatedPropCode(key)));
        }
        it.props = true;
        cxt.ok((0, codegen_1._) `${errsCount} === ${names_1.default.errors}`);
        function unevaluatedPropCode(key) {
            if (schema === false) {
                cxt.setParams({ unevaluatedProperty: key });
                cxt.error();
                if (!allErrors)
                    gen.break();
                return;
            }
            if (!(0, util_1.alwaysValidSchema)(it, schema)) {
                const valid = gen.name("valid");
                cxt.subschema({
                    keyword: "unevaluatedProperties",
                    dataProp: key,
                    dataPropType: util_1.Type.Str,
                }, valid);
                if (!allErrors)
                    gen.if((0, codegen_1.not)(valid), () => gen.break());
            }
        }
        function unevaluatedDynamic(evaluatedProps, key) {
            return (0, codegen_1._) `!${evaluatedProps} || !${evaluatedProps}[${key}]`;
        }
        function unevaluatedStatic(evaluatedProps, key) {
            const ps = [];
            for (const p in evaluatedProps) {
                if (evaluatedProps[p] === true)
                    ps.push((0, codegen_1._) `${key} !== ${p}`);
            }
            return (0, codegen_1.and)(...ps);
        }
    },
};
exports["default"] = def;
//# sourceMappingURL=unevaluatedProperties.js.map

/***/ }),

/***/ 8026:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const equal_1 = __nccwpck_require__(4951);
const error = {
    message: "must be equal to constant",
    params: ({ schemaCode }) => (0, codegen_1._) `{allowedValue: ${schemaCode}}`,
};
const def = {
    keyword: "const",
    $data: true,
    error,
    code(cxt) {
        const { gen, data, $data, schemaCode, schema } = cxt;
        if ($data || (schema && typeof schema == "object")) {
            cxt.fail$data((0, codegen_1._) `!${(0, util_1.useFunc)(gen, equal_1.default)}(${data}, ${schemaCode})`);
        }
        else {
            cxt.fail((0, codegen_1._) `${schema} !== ${data}`);
        }
    },
};
exports["default"] = def;
//# sourceMappingURL=const.js.map

/***/ }),

/***/ 643:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const dependencies_1 = __nccwpck_require__(5826);
const def = {
    keyword: "dependentRequired",
    type: "object",
    schemaType: "object",
    error: dependencies_1.error,
    code: (cxt) => (0, dependencies_1.validatePropertyDeps)(cxt),
};
exports["default"] = def;
//# sourceMappingURL=dependentRequired.js.map

/***/ }),

/***/ 3200:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const equal_1 = __nccwpck_require__(4951);
const error = {
    message: "must be equal to one of the allowed values",
    params: ({ schemaCode }) => (0, codegen_1._) `{allowedValues: ${schemaCode}}`,
};
const def = {
    keyword: "enum",
    schemaType: "array",
    $data: true,
    error,
    code(cxt) {
        const { gen, data, $data, schema, schemaCode, it } = cxt;
        if (!$data && schema.length === 0)
            throw new Error("enum must have non-empty array");
        const useLoop = schema.length >= it.opts.loopEnum;
        let eql;
        const getEql = () => (eql !== null && eql !== void 0 ? eql : (eql = (0, util_1.useFunc)(gen, equal_1.default)));
        let valid;
        if (useLoop || $data) {
            valid = gen.let("valid");
            cxt.block$data(valid, loopEnum);
        }
        else {
            /* istanbul ignore if */
            if (!Array.isArray(schema))
                throw new Error("ajv implementation error");
            const vSchema = gen.const("vSchema", schemaCode);
            valid = (0, codegen_1.or)(...schema.map((_x, i) => equalCode(vSchema, i)));
        }
        cxt.pass(valid);
        function loopEnum() {
            gen.assign(valid, false);
            gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1._) `${getEql()}(${data}, ${v})`, () => gen.assign(valid, true).break()));
        }
        function equalCode(vSchema, i) {
            const sch = schema[i];
            return typeof sch === "object" && sch !== null
                ? (0, codegen_1._) `${getEql()}(${data}, ${vSchema}[${i}])`
                : (0, codegen_1._) `${data} === ${sch}`;
        }
    },
};
exports["default"] = def;
//# sourceMappingURL=enum.js.map

/***/ }),

/***/ 5481:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const limitNumber_1 = __nccwpck_require__(3723);
const multipleOf_1 = __nccwpck_require__(8132);
const limitLength_1 = __nccwpck_require__(6962);
const pattern_1 = __nccwpck_require__(6023);
const limitProperties_1 = __nccwpck_require__(895);
const required_1 = __nccwpck_require__(4504);
const limitItems_1 = __nccwpck_require__(6296);
const uniqueItems_1 = __nccwpck_require__(5132);
const const_1 = __nccwpck_require__(8026);
const enum_1 = __nccwpck_require__(3200);
const validation = [
    // number
    limitNumber_1.default,
    multipleOf_1.default,
    // string
    limitLength_1.default,
    pattern_1.default,
    // object
    limitProperties_1.default,
    required_1.default,
    // array
    limitItems_1.default,
    uniqueItems_1.default,
    // any
    { keyword: "type", schemaType: ["string", "array"] },
    { keyword: "nullable", schemaType: "boolean" },
    const_1.default,
    enum_1.default,
];
exports["default"] = validation;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 3907:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const util_1 = __nccwpck_require__(4464);
const def = {
    keyword: ["maxContains", "minContains"],
    type: "array",
    schemaType: "number",
    code({ keyword, parentSchema, it }) {
        if (parentSchema.contains === undefined) {
            (0, util_1.checkStrictMode)(it, `"${keyword}" without "contains" is ignored`);
        }
    },
};
exports["default"] = def;
//# sourceMappingURL=limitContains.js.map

/***/ }),

/***/ 6296:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const error = {
    message({ keyword, schemaCode }) {
        const comp = keyword === "maxItems" ? "more" : "fewer";
        return (0, codegen_1.str) `must NOT have ${comp} than ${schemaCode} items`;
    },
    params: ({ schemaCode }) => (0, codegen_1._) `{limit: ${schemaCode}}`,
};
const def = {
    keyword: ["maxItems", "minItems"],
    type: "array",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        const op = keyword === "maxItems" ? codegen_1.operators.GT : codegen_1.operators.LT;
        cxt.fail$data((0, codegen_1._) `${data}.length ${op} ${schemaCode}`);
    },
};
exports["default"] = def;
//# sourceMappingURL=limitItems.js.map

/***/ }),

/***/ 6962:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const ucs2length_1 = __nccwpck_require__(6214);
const error = {
    message({ keyword, schemaCode }) {
        const comp = keyword === "maxLength" ? "more" : "fewer";
        return (0, codegen_1.str) `must NOT have ${comp} than ${schemaCode} characters`;
    },
    params: ({ schemaCode }) => (0, codegen_1._) `{limit: ${schemaCode}}`,
};
const def = {
    keyword: ["maxLength", "minLength"],
    type: "string",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
        const { keyword, data, schemaCode, it } = cxt;
        const op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT;
        const len = it.opts.unicode === false ? (0, codegen_1._) `${data}.length` : (0, codegen_1._) `${(0, util_1.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
        cxt.fail$data((0, codegen_1._) `${len} ${op} ${schemaCode}`);
    },
};
exports["default"] = def;
//# sourceMappingURL=limitLength.js.map

/***/ }),

/***/ 3723:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const ops = codegen_1.operators;
const KWDs = {
    maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
    minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
    exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
    exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE },
};
const error = {
    message: ({ keyword, schemaCode }) => (0, codegen_1.str) `must be ${KWDs[keyword].okStr} ${schemaCode}`,
    params: ({ keyword, schemaCode }) => (0, codegen_1._) `{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`,
};
const def = {
    keyword: Object.keys(KWDs),
    type: "number",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        cxt.fail$data((0, codegen_1._) `${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
    },
};
exports["default"] = def;
//# sourceMappingURL=limitNumber.js.map

/***/ }),

/***/ 895:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const error = {
    message({ keyword, schemaCode }) {
        const comp = keyword === "maxProperties" ? "more" : "fewer";
        return (0, codegen_1.str) `must NOT have ${comp} than ${schemaCode} properties`;
    },
    params: ({ schemaCode }) => (0, codegen_1._) `{limit: ${schemaCode}}`,
};
const def = {
    keyword: ["maxProperties", "minProperties"],
    type: "object",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        const op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
        cxt.fail$data((0, codegen_1._) `Object.keys(${data}).length ${op} ${schemaCode}`);
    },
};
exports["default"] = def;
//# sourceMappingURL=limitProperties.js.map

/***/ }),

/***/ 8132:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const codegen_1 = __nccwpck_require__(1436);
const error = {
    message: ({ schemaCode }) => (0, codegen_1.str) `must be multiple of ${schemaCode}`,
    params: ({ schemaCode }) => (0, codegen_1._) `{multipleOf: ${schemaCode}}`,
};
const def = {
    keyword: "multipleOf",
    type: "number",
    schemaType: "number",
    $data: true,
    error,
    code(cxt) {
        const { gen, data, schemaCode, it } = cxt;
        // const bdt = bad$DataType(schemaCode, <string>def.schemaType, $data)
        const prec = it.opts.multipleOfPrecision;
        const res = gen.let("res");
        const invalid = prec
            ? (0, codegen_1._) `Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}`
            : (0, codegen_1._) `${res} !== parseInt(${res})`;
        cxt.fail$data((0, codegen_1._) `(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
    },
};
exports["default"] = def;
//# sourceMappingURL=multipleOf.js.map

/***/ }),

/***/ 6023:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const code_1 = __nccwpck_require__(8484);
const util_1 = __nccwpck_require__(4464);
const codegen_1 = __nccwpck_require__(1436);
const error = {
    message: ({ schemaCode }) => (0, codegen_1.str) `must match pattern "${schemaCode}"`,
    params: ({ schemaCode }) => (0, codegen_1._) `{pattern: ${schemaCode}}`,
};
const def = {
    keyword: "pattern",
    type: "string",
    schemaType: "string",
    $data: true,
    error,
    code(cxt) {
        const { gen, data, $data, schema, schemaCode, it } = cxt;
        const u = it.opts.unicodeRegExp ? "u" : "";
        if ($data) {
            const { regExp } = it.opts.code;
            const regExpCode = regExp.code === "new RegExp" ? (0, codegen_1._) `new RegExp` : (0, util_1.useFunc)(gen, regExp);
            const valid = gen.let("valid");
            gen.try(() => gen.assign(valid, (0, codegen_1._) `${regExpCode}(${schemaCode}, ${u}).test(${data})`), () => gen.assign(valid, false));
            cxt.fail$data((0, codegen_1._) `!${valid}`);
        }
        else {
            const regExp = (0, code_1.usePattern)(cxt, schema);
            cxt.fail$data((0, codegen_1._) `!${regExp}.test(${data})`);
        }
    },
};
exports["default"] = def;
//# sourceMappingURL=pattern.js.map

/***/ }),

/***/ 4504:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const code_1 = __nccwpck_require__(8484);
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const error = {
    message: ({ params: { missingProperty } }) => (0, codegen_1.str) `must have required property '${missingProperty}'`,
    params: ({ params: { missingProperty } }) => (0, codegen_1._) `{missingProperty: ${missingProperty}}`,
};
const def = {
    keyword: "required",
    type: "object",
    schemaType: "array",
    $data: true,
    error,
    code(cxt) {
        const { gen, schema, schemaCode, data, $data, it } = cxt;
        const { opts } = it;
        if (!$data && schema.length === 0)
            return;
        const useLoop = schema.length >= opts.loopRequired;
        if (it.allErrors)
            allErrorsMode();
        else
            exitOnErrorMode();
        if (opts.strictRequired) {
            const props = cxt.parentSchema.properties;
            const { definedProperties } = cxt.it;
            for (const requiredKey of schema) {
                if ((props === null || props === void 0 ? void 0 : props[requiredKey]) === undefined && !definedProperties.has(requiredKey)) {
                    const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
                    const msg = `required property "${requiredKey}" is not defined at "${schemaPath}" (strictRequired)`;
                    (0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
                }
            }
        }
        function allErrorsMode() {
            if (useLoop || $data) {
                cxt.block$data(codegen_1.nil, loopAllRequired);
            }
            else {
                for (const prop of schema) {
                    (0, code_1.checkReportMissingProp)(cxt, prop);
                }
            }
        }
        function exitOnErrorMode() {
            const missing = gen.let("missing");
            if (useLoop || $data) {
                const valid = gen.let("valid", true);
                cxt.block$data(valid, () => loopUntilMissing(missing, valid));
                cxt.ok(valid);
            }
            else {
                gen.if((0, code_1.checkMissingProp)(cxt, schema, missing));
                (0, code_1.reportMissingProp)(cxt, missing);
                gen.else();
            }
        }
        function loopAllRequired() {
            gen.forOf("prop", schemaCode, (prop) => {
                cxt.setParams({ missingProperty: prop });
                gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
            });
        }
        function loopUntilMissing(missing, valid) {
            cxt.setParams({ missingProperty: missing });
            gen.forOf(missing, schemaCode, () => {
                gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties));
                gen.if((0, codegen_1.not)(valid), () => {
                    cxt.error();
                    gen.break();
                });
            }, codegen_1.nil);
        }
    },
};
exports["default"] = def;
//# sourceMappingURL=required.js.map

/***/ }),

/***/ 5132:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const dataType_1 = __nccwpck_require__(6685);
const codegen_1 = __nccwpck_require__(1436);
const util_1 = __nccwpck_require__(4464);
const equal_1 = __nccwpck_require__(4951);
const error = {
    message: ({ params: { i, j } }) => (0, codegen_1.str) `must NOT have duplicate items (items ## ${j} and ${i} are identical)`,
    params: ({ params: { i, j } }) => (0, codegen_1._) `{i: ${i}, j: ${j}}`,
};
const def = {
    keyword: "uniqueItems",
    type: "array",
    schemaType: "boolean",
    $data: true,
    error,
    code(cxt) {
        const { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
        if (!$data && !schema)
            return;
        const valid = gen.let("valid");
        const itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
        cxt.block$data(valid, validateUniqueItems, (0, codegen_1._) `${schemaCode} === false`);
        cxt.ok(valid);
        function validateUniqueItems() {
            const i = gen.let("i", (0, codegen_1._) `${data}.length`);
            const j = gen.let("j");
            cxt.setParams({ i, j });
            gen.assign(valid, true);
            gen.if((0, codegen_1._) `${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
        }
        function canOptimize() {
            return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
        }
        function loopN(i, j) {
            const item = gen.name("item");
            const wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
            const indices = gen.const("indices", (0, codegen_1._) `{}`);
            gen.for((0, codegen_1._) `;${i}--;`, () => {
                gen.let(item, (0, codegen_1._) `${data}[${i}]`);
                gen.if(wrongType, (0, codegen_1._) `continue`);
                if (itemTypes.length > 1)
                    gen.if((0, codegen_1._) `typeof ${item} == "string"`, (0, codegen_1._) `${item} += "_"`);
                gen
                    .if((0, codegen_1._) `typeof ${indices}[${item}] == "number"`, () => {
                    gen.assign(j, (0, codegen_1._) `${indices}[${item}]`);
                    cxt.error();
                    gen.assign(valid, false).break();
                })
                    .code((0, codegen_1._) `${indices}[${item}] = ${i}`);
            });
        }
        function loopN2(i, j) {
            const eql = (0, util_1.useFunc)(gen, equal_1.default);
            const outer = gen.name("outer");
            gen.label(outer).for((0, codegen_1._) `;${i}--;`, () => gen.for((0, codegen_1._) `${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1._) `${eql}(${data}[${i}], ${data}[${j}])`, () => {
                cxt.error();
                gen.assign(valid, false).break(outer);
            })));
        }
    },
};
exports["default"] = def;
//# sourceMappingURL=uniqueItems.js.map

/***/ }),

/***/ 3430:
/***/ ((module) => {



// do not edit .js files directly - edit src/index.jst



module.exports = function equal(a, b) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    if (a.constructor !== b.constructor) return false;

    var length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!equal(a[i], b[i])) return false;
      return true;
    }



    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0;)
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      var key = keys[i];

      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a!==a && b!==b;
};


/***/ }),

/***/ 5756:
/***/ ((__unused_webpack_module, exports) => {

// Copyright 2014, 2015, 2016, 2017, 2018 Simon Lydell
// License: MIT. (See LICENSE.)

Object.defineProperty(exports, "__esModule", ({
  value: true
}))

// This regex comes from regex.coffee, and is inserted here by generate-index.js
// (run `npm run build`).
exports["default"] = /((['"])(?:(?!\2|\\).|\\(?:\r\n|[\s\S]))*(\2)?|`(?:[^`\\$]|\\[\s\S]|\$(?!\{)|\$\{(?:[^{}]|\{[^}]*\}?)*\}?)*(`)?)|(\/\/.*)|(\/\*(?:[^*]|\*(?!\/))*(\*\/)?)|(\/(?!\*)(?:\[(?:(?![\]\\]).|\\.)*\]|(?![\/\]\\]).|\\.)+\/(?:(?!\s*(?:\b|[\u0080-\uFFFF$\\'"~({]|[+\-!](?!=)|\.?\d))|[gmiyus]{1,6}\b(?![\u0080-\uFFFF$\\]|\s*(?:[+\-*%&|^<>!=?({]|\/(?![\/*])))))|(0[xX][\da-fA-F]+|0[oO][0-7]+|0[bB][01]+|(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?)|((?!\d)(?:(?!\s)[$\w\u0080-\uFFFF]|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]+\})+)|(--|\+\+|&&|\|\||=>|\.{3}|(?:[+\-\/%&|^]|\*{1,2}|<{1,2}|>{1,3}|!=?|={1,2})=?|[?~.,:;[\](){}])|(\s+)|(^$|[\s\S])/g

exports.matchToToken = function(match) {
  var token = {type: "invalid", value: match[0], closed: undefined}
       if (match[ 1]) token.type = "string" , token.closed = !!(match[3] || match[4])
  else if (match[ 5]) token.type = "comment"
  else if (match[ 6]) token.type = "comment", token.closed = !!match[7]
  else if (match[ 8]) token.type = "regex"
  else if (match[ 9]) token.type = "number"
  else if (match[10]) token.type = "name"
  else if (match[11]) token.type = "punctuator"
  else if (match[12]) token.type = "whitespace"
  return token
}


/***/ }),

/***/ 4281:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {




var loader = __nccwpck_require__(1950);
var dumper = __nccwpck_require__(9980);


function renamed(from, to) {
  return function () {
    throw new Error('Function yaml.' + from + ' is removed in js-yaml 4. ' +
      'Use yaml.' + to + ' instead, which is now safe by default.');
  };
}


module.exports.Type = __nccwpck_require__(9557);
module.exports.Schema = __nccwpck_require__(2046);
module.exports.FAILSAFE_SCHEMA = __nccwpck_require__(9832);
module.exports.JSON_SCHEMA = __nccwpck_require__(8927);
module.exports.CORE_SCHEMA = __nccwpck_require__(5746);
module.exports.DEFAULT_SCHEMA = __nccwpck_require__(7336);
module.exports.load                = loader.load;
module.exports.loadAll             = loader.loadAll;
module.exports.dump                = dumper.dump;
module.exports.YAMLException = __nccwpck_require__(1248);

// Re-export all types in case user wants to create custom schema
module.exports.types = {
  binary:    __nccwpck_require__(8149),
  float:     __nccwpck_require__(7584),
  map:       __nccwpck_require__(7316),
  null:      __nccwpck_require__(4333),
  pairs:     __nccwpck_require__(6267),
  set:       __nccwpck_require__(8758),
  timestamp: __nccwpck_require__(8966),
  bool:      __nccwpck_require__(7296),
  int:       __nccwpck_require__(4652),
  merge:     __nccwpck_require__(6854),
  omap:      __nccwpck_require__(8649),
  seq:       __nccwpck_require__(7161),
  str:       __nccwpck_require__(3929)
};

// Removed functions from JS-YAML 3.0.x
module.exports.safeLoad            = renamed('safeLoad', 'load');
module.exports.safeLoadAll         = renamed('safeLoadAll', 'loadAll');
module.exports.safeDump            = renamed('safeDump', 'dump');


/***/ }),

/***/ 9816:
/***/ ((module) => {




function isNothing(subject) {
  return (typeof subject === 'undefined') || (subject === null);
}


function isObject(subject) {
  return (typeof subject === 'object') && (subject !== null);
}


function toArray(sequence) {
  if (Array.isArray(sequence)) return sequence;
  else if (isNothing(sequence)) return [];

  return [ sequence ];
}


function extend(target, source) {
  var index, length, key, sourceKeys;

  if (source) {
    sourceKeys = Object.keys(source);

    for (index = 0, length = sourceKeys.length; index < length; index += 1) {
      key = sourceKeys[index];
      target[key] = source[key];
    }
  }

  return target;
}


function repeat(string, count) {
  var result = '', cycle;

  for (cycle = 0; cycle < count; cycle += 1) {
    result += string;
  }

  return result;
}


function isNegativeZero(number) {
  return (number === 0) && (Number.NEGATIVE_INFINITY === 1 / number);
}


module.exports.isNothing      = isNothing;
module.exports.isObject       = isObject;
module.exports.toArray        = toArray;
module.exports.repeat         = repeat;
module.exports.isNegativeZero = isNegativeZero;
module.exports.extend         = extend;


/***/ }),

/***/ 9980:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



/*eslint-disable no-use-before-define*/

var common              = __nccwpck_require__(9816);
var YAMLException       = __nccwpck_require__(1248);
var DEFAULT_SCHEMA      = __nccwpck_require__(7336);

var _toString       = Object.prototype.toString;
var _hasOwnProperty = Object.prototype.hasOwnProperty;

var CHAR_BOM                  = 0xFEFF;
var CHAR_TAB                  = 0x09; /* Tab */
var CHAR_LINE_FEED            = 0x0A; /* LF */
var CHAR_CARRIAGE_RETURN      = 0x0D; /* CR */
var CHAR_SPACE                = 0x20; /* Space */
var CHAR_EXCLAMATION          = 0x21; /* ! */
var CHAR_DOUBLE_QUOTE         = 0x22; /* " */
var CHAR_SHARP                = 0x23; /* # */
var CHAR_PERCENT              = 0x25; /* % */
var CHAR_AMPERSAND            = 0x26; /* & */
var CHAR_SINGLE_QUOTE         = 0x27; /* ' */
var CHAR_ASTERISK             = 0x2A; /* * */
var CHAR_COMMA                = 0x2C; /* , */
var CHAR_MINUS                = 0x2D; /* - */
var CHAR_COLON                = 0x3A; /* : */
var CHAR_EQUALS               = 0x3D; /* = */
var CHAR_GREATER_THAN         = 0x3E; /* > */
var CHAR_QUESTION             = 0x3F; /* ? */
var CHAR_COMMERCIAL_AT        = 0x40; /* @ */
var CHAR_LEFT_SQUARE_BRACKET  = 0x5B; /* [ */
var CHAR_RIGHT_SQUARE_BRACKET = 0x5D; /* ] */
var CHAR_GRAVE_ACCENT         = 0x60; /* ` */
var CHAR_LEFT_CURLY_BRACKET   = 0x7B; /* { */
var CHAR_VERTICAL_LINE        = 0x7C; /* | */
var CHAR_RIGHT_CURLY_BRACKET  = 0x7D; /* } */

var ESCAPE_SEQUENCES = {};

ESCAPE_SEQUENCES[0x00]   = '\\0';
ESCAPE_SEQUENCES[0x07]   = '\\a';
ESCAPE_SEQUENCES[0x08]   = '\\b';
ESCAPE_SEQUENCES[0x09]   = '\\t';
ESCAPE_SEQUENCES[0x0A]   = '\\n';
ESCAPE_SEQUENCES[0x0B]   = '\\v';
ESCAPE_SEQUENCES[0x0C]   = '\\f';
ESCAPE_SEQUENCES[0x0D]   = '\\r';
ESCAPE_SEQUENCES[0x1B]   = '\\e';
ESCAPE_SEQUENCES[0x22]   = '\\"';
ESCAPE_SEQUENCES[0x5C]   = '\\\\';
ESCAPE_SEQUENCES[0x85]   = '\\N';
ESCAPE_SEQUENCES[0xA0]   = '\\_';
ESCAPE_SEQUENCES[0x2028] = '\\L';
ESCAPE_SEQUENCES[0x2029] = '\\P';

var DEPRECATED_BOOLEANS_SYNTAX = [
  'y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON',
  'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF'
];

var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;

function compileStyleMap(schema, map) {
  var result, keys, index, length, tag, style, type;

  if (map === null) return {};

  result = {};
  keys = Object.keys(map);

  for (index = 0, length = keys.length; index < length; index += 1) {
    tag = keys[index];
    style = String(map[tag]);

    if (tag.slice(0, 2) === '!!') {
      tag = 'tag:yaml.org,2002:' + tag.slice(2);
    }
    type = schema.compiledTypeMap['fallback'][tag];

    if (type && _hasOwnProperty.call(type.styleAliases, style)) {
      style = type.styleAliases[style];
    }

    result[tag] = style;
  }

  return result;
}

function encodeHex(character) {
  var string, handle, length;

  string = character.toString(16).toUpperCase();

  if (character <= 0xFF) {
    handle = 'x';
    length = 2;
  } else if (character <= 0xFFFF) {
    handle = 'u';
    length = 4;
  } else if (character <= 0xFFFFFFFF) {
    handle = 'U';
    length = 8;
  } else {
    throw new YAMLException('code point within a string may not be greater than 0xFFFFFFFF');
  }

  return '\\' + handle + common.repeat('0', length - string.length) + string;
}


var QUOTING_TYPE_SINGLE = 1,
    QUOTING_TYPE_DOUBLE = 2;

function State(options) {
  this.schema        = options['schema'] || DEFAULT_SCHEMA;
  this.indent        = Math.max(1, (options['indent'] || 2));
  this.noArrayIndent = options['noArrayIndent'] || false;
  this.skipInvalid   = options['skipInvalid'] || false;
  this.flowLevel     = (common.isNothing(options['flowLevel']) ? -1 : options['flowLevel']);
  this.styleMap      = compileStyleMap(this.schema, options['styles'] || null);
  this.sortKeys      = options['sortKeys'] || false;
  this.lineWidth     = options['lineWidth'] || 80;
  this.noRefs        = options['noRefs'] || false;
  this.noCompatMode  = options['noCompatMode'] || false;
  this.condenseFlow  = options['condenseFlow'] || false;
  this.quotingType   = options['quotingType'] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
  this.forceQuotes   = options['forceQuotes'] || false;
  this.replacer      = typeof options['replacer'] === 'function' ? options['replacer'] : null;

  this.implicitTypes = this.schema.compiledImplicit;
  this.explicitTypes = this.schema.compiledExplicit;

  this.tag = null;
  this.result = '';

  this.duplicates = [];
  this.usedDuplicates = null;
}

// Indents every line in a string. Empty lines (\n only) are not indented.
function indentString(string, spaces) {
  var ind = common.repeat(' ', spaces),
      position = 0,
      next = -1,
      result = '',
      line,
      length = string.length;

  while (position < length) {
    next = string.indexOf('\n', position);
    if (next === -1) {
      line = string.slice(position);
      position = length;
    } else {
      line = string.slice(position, next + 1);
      position = next + 1;
    }

    if (line.length && line !== '\n') result += ind;

    result += line;
  }

  return result;
}

function generateNextLine(state, level) {
  return '\n' + common.repeat(' ', state.indent * level);
}

function testImplicitResolving(state, str) {
  var index, length, type;

  for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
    type = state.implicitTypes[index];

    if (type.resolve(str)) {
      return true;
    }
  }

  return false;
}

// [33] s-white ::= s-space | s-tab
function isWhitespace(c) {
  return c === CHAR_SPACE || c === CHAR_TAB;
}

// Returns true if the character can be printed without escaping.
// From YAML 1.2: "any allowed characters known to be non-printable
// should also be escaped. [However,] This isn’t mandatory"
// Derived from nb-char - \t - #x85 - #xA0 - #x2028 - #x2029.
function isPrintable(c) {
  return  (0x00020 <= c && c <= 0x00007E)
      || ((0x000A1 <= c && c <= 0x00D7FF) && c !== 0x2028 && c !== 0x2029)
      || ((0x0E000 <= c && c <= 0x00FFFD) && c !== CHAR_BOM)
      ||  (0x10000 <= c && c <= 0x10FFFF);
}

// [34] ns-char ::= nb-char - s-white
// [27] nb-char ::= c-printable - b-char - c-byte-order-mark
// [26] b-char  ::= b-line-feed | b-carriage-return
// Including s-white (for some reason, examples doesn't match specs in this aspect)
// ns-char ::= c-printable - b-line-feed - b-carriage-return - c-byte-order-mark
function isNsCharOrWhitespace(c) {
  return isPrintable(c)
    && c !== CHAR_BOM
    // - b-char
    && c !== CHAR_CARRIAGE_RETURN
    && c !== CHAR_LINE_FEED;
}

// [127]  ns-plain-safe(c) ::= c = flow-out  ⇒ ns-plain-safe-out
//                             c = flow-in   ⇒ ns-plain-safe-in
//                             c = block-key ⇒ ns-plain-safe-out
//                             c = flow-key  ⇒ ns-plain-safe-in
// [128] ns-plain-safe-out ::= ns-char
// [129]  ns-plain-safe-in ::= ns-char - c-flow-indicator
// [130]  ns-plain-char(c) ::=  ( ns-plain-safe(c) - “:” - “#” )
//                            | ( /* An ns-char preceding */ “#” )
//                            | ( “:” /* Followed by an ns-plain-safe(c) */ )
function isPlainSafe(c, prev, inblock) {
  var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
  var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
  return (
    // ns-plain-safe
    inblock ? // c = flow-in
      cIsNsCharOrWhitespace
      : cIsNsCharOrWhitespace
        // - c-flow-indicator
        && c !== CHAR_COMMA
        && c !== CHAR_LEFT_SQUARE_BRACKET
        && c !== CHAR_RIGHT_SQUARE_BRACKET
        && c !== CHAR_LEFT_CURLY_BRACKET
        && c !== CHAR_RIGHT_CURLY_BRACKET
  )
    // ns-plain-char
    && c !== CHAR_SHARP // false on '#'
    && !(prev === CHAR_COLON && !cIsNsChar) // false on ': '
    || (isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP) // change to true on '[^ ]#'
    || (prev === CHAR_COLON && cIsNsChar); // change to true on ':[^ ]'
}

// Simplified test for values allowed as the first character in plain style.
function isPlainSafeFirst(c) {
  // Uses a subset of ns-char - c-indicator
  // where ns-char = nb-char - s-white.
  // No support of ( ( “?” | “:” | “-” ) /* Followed by an ns-plain-safe(c)) */ ) part
  return isPrintable(c) && c !== CHAR_BOM
    && !isWhitespace(c) // - s-white
    // - (c-indicator ::=
    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
    && c !== CHAR_MINUS
    && c !== CHAR_QUESTION
    && c !== CHAR_COLON
    && c !== CHAR_COMMA
    && c !== CHAR_LEFT_SQUARE_BRACKET
    && c !== CHAR_RIGHT_SQUARE_BRACKET
    && c !== CHAR_LEFT_CURLY_BRACKET
    && c !== CHAR_RIGHT_CURLY_BRACKET
    // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
    && c !== CHAR_SHARP
    && c !== CHAR_AMPERSAND
    && c !== CHAR_ASTERISK
    && c !== CHAR_EXCLAMATION
    && c !== CHAR_VERTICAL_LINE
    && c !== CHAR_EQUALS
    && c !== CHAR_GREATER_THAN
    && c !== CHAR_SINGLE_QUOTE
    && c !== CHAR_DOUBLE_QUOTE
    // | “%” | “@” | “`”)
    && c !== CHAR_PERCENT
    && c !== CHAR_COMMERCIAL_AT
    && c !== CHAR_GRAVE_ACCENT;
}

// Simplified test for values allowed as the last character in plain style.
function isPlainSafeLast(c) {
  // just not whitespace or colon, it will be checked to be plain character later
  return !isWhitespace(c) && c !== CHAR_COLON;
}

// Same as 'string'.codePointAt(pos), but works in older browsers.
function codePointAt(string, pos) {
  var first = string.charCodeAt(pos), second;
  if (first >= 0xD800 && first <= 0xDBFF && pos + 1 < string.length) {
    second = string.charCodeAt(pos + 1);
    if (second >= 0xDC00 && second <= 0xDFFF) {
      // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
    }
  }
  return first;
}

// Determines whether block indentation indicator is required.
function needIndentIndicator(string) {
  var leadingSpaceRe = /^\n* /;
  return leadingSpaceRe.test(string);
}

var STYLE_PLAIN   = 1,
    STYLE_SINGLE  = 2,
    STYLE_LITERAL = 3,
    STYLE_FOLDED  = 4,
    STYLE_DOUBLE  = 5;

// Determines which scalar styles are possible and returns the preferred style.
// lineWidth = -1 => no limit.
// Pre-conditions: str.length > 0.
// Post-conditions:
//    STYLE_PLAIN or STYLE_SINGLE => no \n are in the string.
//    STYLE_LITERAL => no lines are suitable for folding (or lineWidth is -1).
//    STYLE_FOLDED => a line > lineWidth and can be folded (and lineWidth != -1).
function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth,
  testAmbiguousType, quotingType, forceQuotes, inblock) {

  var i;
  var char = 0;
  var prevChar = null;
  var hasLineBreak = false;
  var hasFoldableLine = false; // only checked if shouldTrackWidth
  var shouldTrackWidth = lineWidth !== -1;
  var previousLineBreak = -1; // count the first line correctly
  var plain = isPlainSafeFirst(codePointAt(string, 0))
          && isPlainSafeLast(codePointAt(string, string.length - 1));

  if (singleLineOnly || forceQuotes) {
    // Case: no block styles.
    // Check for disallowed characters to rule out plain and single.
    for (i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
  } else {
    // Case: block styles permitted.
    for (i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (char === CHAR_LINE_FEED) {
        hasLineBreak = true;
        // Check if any line can be folded.
        if (shouldTrackWidth) {
          hasFoldableLine = hasFoldableLine ||
            // Foldable line = too long, and not more-indented.
            (i - previousLineBreak - 1 > lineWidth &&
             string[previousLineBreak + 1] !== ' ');
          previousLineBreak = i;
        }
      } else if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
    // in case the end is missing a \n
    hasFoldableLine = hasFoldableLine || (shouldTrackWidth &&
      (i - previousLineBreak - 1 > lineWidth &&
       string[previousLineBreak + 1] !== ' '));
  }
  // Although every style can represent \n without escaping, prefer block styles
  // for multiline, since they're more readable and they don't add empty lines.
  // Also prefer folding a super-long line.
  if (!hasLineBreak && !hasFoldableLine) {
    // Strings interpretable as another type have to be quoted;
    // e.g. the string 'true' vs. the boolean true.
    if (plain && !forceQuotes && !testAmbiguousType(string)) {
      return STYLE_PLAIN;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  // Edge case: block indentation indicator can only have one digit.
  if (indentPerLevel > 9 && needIndentIndicator(string)) {
    return STYLE_DOUBLE;
  }
  // At this point we know block styles are valid.
  // Prefer literal style unless we want to fold.
  if (!forceQuotes) {
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
  }
  return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
}

// Note: line breaking/folding is implemented for only the folded style.
// NB. We drop the last trailing newline (if any) of a returned block scalar
//  since the dumper adds its own newline. This always works:
//    • No ending newline => unaffected; already using strip "-" chomping.
//    • Ending newline    => removed then restored.
//  Importantly, this keeps the "+" chomp indicator from gaining an extra line.
function writeScalar(state, string, level, iskey, inblock) {
  state.dump = (function () {
    if (string.length === 0) {
      return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
    }
    if (!state.noCompatMode) {
      if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? ('"' + string + '"') : ("'" + string + "'");
      }
    }

    var indent = state.indent * Math.max(1, level); // no 0-indent scalars
    // As indentation gets deeper, let the width decrease monotonically
    // to the lower bound min(state.lineWidth, 40).
    // Note that this implies
    //  state.lineWidth ≤ 40 + state.indent: width is fixed at the lower bound.
    //  state.lineWidth > 40 + state.indent: width decreases until the lower bound.
    // This behaves better than a constant minimum width which disallows narrower options,
    // or an indent threshold which causes the width to suddenly increase.
    var lineWidth = state.lineWidth === -1
      ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);

    // Without knowing if keys are implicit/explicit, assume implicit for safety.
    var singleLineOnly = iskey
      // No block styles in flow mode.
      || (state.flowLevel > -1 && level >= state.flowLevel);
    function testAmbiguity(string) {
      return testImplicitResolving(state, string);
    }

    switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth,
      testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {

      case STYLE_PLAIN:
        return string;
      case STYLE_SINGLE:
        return "'" + string.replace(/'/g, "''") + "'";
      case STYLE_LITERAL:
        return '|' + blockHeader(string, state.indent)
          + dropEndingNewline(indentString(string, indent));
      case STYLE_FOLDED:
        return '>' + blockHeader(string, state.indent)
          + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
      case STYLE_DOUBLE:
        return '"' + escapeString(string, lineWidth) + '"';
      default:
        throw new YAMLException('impossible error: invalid scalar style');
    }
  }());
}

// Pre-conditions: string is valid for a block scalar, 1 <= indentPerLevel <= 9.
function blockHeader(string, indentPerLevel) {
  var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : '';

  // note the special case: the string '\n' counts as a "trailing" empty line.
  var clip =          string[string.length - 1] === '\n';
  var keep = clip && (string[string.length - 2] === '\n' || string === '\n');
  var chomp = keep ? '+' : (clip ? '' : '-');

  return indentIndicator + chomp + '\n';
}

// (See the note for writeScalar.)
function dropEndingNewline(string) {
  return string[string.length - 1] === '\n' ? string.slice(0, -1) : string;
}

// Note: a long line without a suitable break point will exceed the width limit.
// Pre-conditions: every char in str isPrintable, str.length > 0, width > 0.
function foldString(string, width) {
  // In folded style, $k$ consecutive newlines output as $k+1$ newlines—
  // unless they're before or after a more-indented line, or at the very
  // beginning or end, in which case $k$ maps to $k$.
  // Therefore, parse each chunk as newline(s) followed by a content line.
  var lineRe = /(\n+)([^\n]*)/g;

  // first line (possibly an empty line)
  var result = (function () {
    var nextLF = string.indexOf('\n');
    nextLF = nextLF !== -1 ? nextLF : string.length;
    lineRe.lastIndex = nextLF;
    return foldLine(string.slice(0, nextLF), width);
  }());
  // If we haven't reached the first content line yet, don't add an extra \n.
  var prevMoreIndented = string[0] === '\n' || string[0] === ' ';
  var moreIndented;

  // rest of the lines
  var match;
  while ((match = lineRe.exec(string))) {
    var prefix = match[1], line = match[2];
    moreIndented = (line[0] === ' ');
    result += prefix
      + (!prevMoreIndented && !moreIndented && line !== ''
        ? '\n' : '')
      + foldLine(line, width);
    prevMoreIndented = moreIndented;
  }

  return result;
}

// Greedy line breaking.
// Picks the longest line under the limit each time,
// otherwise settles for the shortest line over the limit.
// NB. More-indented lines *cannot* be folded, as that would add an extra \n.
function foldLine(line, width) {
  if (line === '' || line[0] === ' ') return line;

  // Since a more-indented line adds a \n, breaks can't be followed by a space.
  var breakRe = / [^ ]/g; // note: the match index will always be <= length-2.
  var match;
  // start is an inclusive index. end, curr, and next are exclusive.
  var start = 0, end, curr = 0, next = 0;
  var result = '';

  // Invariants: 0 <= start <= length-1.
  //   0 <= curr <= next <= max(0, length-2). curr - start <= width.
  // Inside the loop:
  //   A match implies length >= 2, so curr and next are <= length-2.
  while ((match = breakRe.exec(line))) {
    next = match.index;
    // maintain invariant: curr - start <= width
    if (next - start > width) {
      end = (curr > start) ? curr : next; // derive end <= length-2
      result += '\n' + line.slice(start, end);
      // skip the space that was output as \n
      start = end + 1;                    // derive start <= length-1
    }
    curr = next;
  }

  // By the invariants, start <= length-1, so there is something left over.
  // It is either the whole string or a part starting from non-whitespace.
  result += '\n';
  // Insert a break if the remainder is too long and there is a break available.
  if (line.length - start > width && curr > start) {
    result += line.slice(start, curr) + '\n' + line.slice(curr + 1);
  } else {
    result += line.slice(start);
  }

  return result.slice(1); // drop extra \n joiner
}

// Escapes a double-quoted string.
function escapeString(string) {
  var result = '';
  var char = 0;
  var escapeSeq;

  for (var i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
    char = codePointAt(string, i);
    escapeSeq = ESCAPE_SEQUENCES[char];

    if (!escapeSeq && isPrintable(char)) {
      result += string[i];
      if (char >= 0x10000) result += string[i + 1];
    } else {
      result += escapeSeq || encodeHex(char);
    }
  }

  return result;
}

function writeFlowSequence(state, level, object) {
  var _result = '',
      _tag    = state.tag,
      index,
      length,
      value;

  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];

    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }

    // Write only valid elements, put null instead of invalid elements.
    if (writeNode(state, level, value, false, false) ||
        (typeof value === 'undefined' &&
         writeNode(state, level, null, false, false))) {

      if (_result !== '') _result += ',' + (!state.condenseFlow ? ' ' : '');
      _result += state.dump;
    }
  }

  state.tag = _tag;
  state.dump = '[' + _result + ']';
}

function writeBlockSequence(state, level, object, compact) {
  var _result = '',
      _tag    = state.tag,
      index,
      length,
      value;

  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];

    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }

    // Write only valid elements, put null instead of invalid elements.
    if (writeNode(state, level + 1, value, true, true, false, true) ||
        (typeof value === 'undefined' &&
         writeNode(state, level + 1, null, true, true, false, true))) {

      if (!compact || _result !== '') {
        _result += generateNextLine(state, level);
      }

      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        _result += '-';
      } else {
        _result += '- ';
      }

      _result += state.dump;
    }
  }

  state.tag = _tag;
  state.dump = _result || '[]'; // Empty sequence if no valid values.
}

function writeFlowMapping(state, level, object) {
  var _result       = '',
      _tag          = state.tag,
      objectKeyList = Object.keys(object),
      index,
      length,
      objectKey,
      objectValue,
      pairBuffer;

  for (index = 0, length = objectKeyList.length; index < length; index += 1) {

    pairBuffer = '';
    if (_result !== '') pairBuffer += ', ';

    if (state.condenseFlow) pairBuffer += '"';

    objectKey = objectKeyList[index];
    objectValue = object[objectKey];

    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }

    if (!writeNode(state, level, objectKey, false, false)) {
      continue; // Skip this pair because of invalid key;
    }

    if (state.dump.length > 1024) pairBuffer += '? ';

    pairBuffer += state.dump + (state.condenseFlow ? '"' : '') + ':' + (state.condenseFlow ? '' : ' ');

    if (!writeNode(state, level, objectValue, false, false)) {
      continue; // Skip this pair because of invalid value.
    }

    pairBuffer += state.dump;

    // Both key and value are valid.
    _result += pairBuffer;
  }

  state.tag = _tag;
  state.dump = '{' + _result + '}';
}

function writeBlockMapping(state, level, object, compact) {
  var _result       = '',
      _tag          = state.tag,
      objectKeyList = Object.keys(object),
      index,
      length,
      objectKey,
      objectValue,
      explicitPair,
      pairBuffer;

  // Allow sorting keys so that the output file is deterministic
  if (state.sortKeys === true) {
    // Default sorting
    objectKeyList.sort();
  } else if (typeof state.sortKeys === 'function') {
    // Custom sort function
    objectKeyList.sort(state.sortKeys);
  } else if (state.sortKeys) {
    // Something is wrong
    throw new YAMLException('sortKeys must be a boolean or a function');
  }

  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = '';

    if (!compact || _result !== '') {
      pairBuffer += generateNextLine(state, level);
    }

    objectKey = objectKeyList[index];
    objectValue = object[objectKey];

    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }

    if (!writeNode(state, level + 1, objectKey, true, true, true)) {
      continue; // Skip this pair because of invalid key.
    }

    explicitPair = (state.tag !== null && state.tag !== '?') ||
                   (state.dump && state.dump.length > 1024);

    if (explicitPair) {
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += '?';
      } else {
        pairBuffer += '? ';
      }
    }

    pairBuffer += state.dump;

    if (explicitPair) {
      pairBuffer += generateNextLine(state, level);
    }

    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
      continue; // Skip this pair because of invalid value.
    }

    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
      pairBuffer += ':';
    } else {
      pairBuffer += ': ';
    }

    pairBuffer += state.dump;

    // Both key and value are valid.
    _result += pairBuffer;
  }

  state.tag = _tag;
  state.dump = _result || '{}'; // Empty mapping if no valid pairs.
}

function detectType(state, object, explicit) {
  var _result, typeList, index, length, type, style;

  typeList = explicit ? state.explicitTypes : state.implicitTypes;

  for (index = 0, length = typeList.length; index < length; index += 1) {
    type = typeList[index];

    if ((type.instanceOf  || type.predicate) &&
        (!type.instanceOf || ((typeof object === 'object') && (object instanceof type.instanceOf))) &&
        (!type.predicate  || type.predicate(object))) {

      if (explicit) {
        if (type.multi && type.representName) {
          state.tag = type.representName(object);
        } else {
          state.tag = type.tag;
        }
      } else {
        state.tag = '?';
      }

      if (type.represent) {
        style = state.styleMap[type.tag] || type.defaultStyle;

        if (_toString.call(type.represent) === '[object Function]') {
          _result = type.represent(object, style);
        } else if (_hasOwnProperty.call(type.represent, style)) {
          _result = type.represent[style](object, style);
        } else {
          throw new YAMLException('!<' + type.tag + '> tag resolver accepts not "' + style + '" style');
        }

        state.dump = _result;
      }

      return true;
    }
  }

  return false;
}

// Serializes `object` and writes it to global `result`.
// Returns true on success, or false on invalid object.
//
function writeNode(state, level, object, block, compact, iskey, isblockseq) {
  state.tag = null;
  state.dump = object;

  if (!detectType(state, object, false)) {
    detectType(state, object, true);
  }

  var type = _toString.call(state.dump);
  var inblock = block;
  var tagStr;

  if (block) {
    block = (state.flowLevel < 0 || state.flowLevel > level);
  }

  var objectOrArray = type === '[object Object]' || type === '[object Array]',
      duplicateIndex,
      duplicate;

  if (objectOrArray) {
    duplicateIndex = state.duplicates.indexOf(object);
    duplicate = duplicateIndex !== -1;
  }

  if ((state.tag !== null && state.tag !== '?') || duplicate || (state.indent !== 2 && level > 0)) {
    compact = false;
  }

  if (duplicate && state.usedDuplicates[duplicateIndex]) {
    state.dump = '*ref_' + duplicateIndex;
  } else {
    if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
      state.usedDuplicates[duplicateIndex] = true;
    }
    if (type === '[object Object]') {
      if (block && (Object.keys(state.dump).length !== 0)) {
        writeBlockMapping(state, level, state.dump, compact);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + state.dump;
        }
      } else {
        writeFlowMapping(state, level, state.dump);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
        }
      }
    } else if (type === '[object Array]') {
      if (block && (state.dump.length !== 0)) {
        if (state.noArrayIndent && !isblockseq && level > 0) {
          writeBlockSequence(state, level - 1, state.dump, compact);
        } else {
          writeBlockSequence(state, level, state.dump, compact);
        }
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + state.dump;
        }
      } else {
        writeFlowSequence(state, level, state.dump);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
        }
      }
    } else if (type === '[object String]') {
      if (state.tag !== '?') {
        writeScalar(state, state.dump, level, iskey, inblock);
      }
    } else if (type === '[object Undefined]') {
      return false;
    } else {
      if (state.skipInvalid) return false;
      throw new YAMLException('unacceptable kind of an object to dump ' + type);
    }

    if (state.tag !== null && state.tag !== '?') {
      // Need to encode all characters except those allowed by the spec:
      //
      // [35] ns-dec-digit    ::=  [#x30-#x39] /* 0-9 */
      // [36] ns-hex-digit    ::=  ns-dec-digit
      //                         | [#x41-#x46] /* A-F */ | [#x61-#x66] /* a-f */
      // [37] ns-ascii-letter ::=  [#x41-#x5A] /* A-Z */ | [#x61-#x7A] /* a-z */
      // [38] ns-word-char    ::=  ns-dec-digit | ns-ascii-letter | “-”
      // [39] ns-uri-char     ::=  “%” ns-hex-digit ns-hex-digit | ns-word-char | “#”
      //                         | “;” | “/” | “?” | “:” | “@” | “&” | “=” | “+” | “$” | “,”
      //                         | “_” | “.” | “!” | “~” | “*” | “'” | “(” | “)” | “[” | “]”
      //
      // Also need to encode '!' because it has special meaning (end of tag prefix).
      //
      tagStr = encodeURI(
        state.tag[0] === '!' ? state.tag.slice(1) : state.tag
      ).replace(/!/g, '%21');

      if (state.tag[0] === '!') {
        tagStr = '!' + tagStr;
      } else if (tagStr.slice(0, 18) === 'tag:yaml.org,2002:') {
        tagStr = '!!' + tagStr.slice(18);
      } else {
        tagStr = '!<' + tagStr + '>';
      }

      state.dump = tagStr + ' ' + state.dump;
    }
  }

  return true;
}

function getDuplicateReferences(object, state) {
  var objects = [],
      duplicatesIndexes = [],
      index,
      length;

  inspectNode(object, objects, duplicatesIndexes);

  for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
    state.duplicates.push(objects[duplicatesIndexes[index]]);
  }
  state.usedDuplicates = new Array(length);
}

function inspectNode(object, objects, duplicatesIndexes) {
  var objectKeyList,
      index,
      length;

  if (object !== null && typeof object === 'object') {
    index = objects.indexOf(object);
    if (index !== -1) {
      if (duplicatesIndexes.indexOf(index) === -1) {
        duplicatesIndexes.push(index);
      }
    } else {
      objects.push(object);

      if (Array.isArray(object)) {
        for (index = 0, length = object.length; index < length; index += 1) {
          inspectNode(object[index], objects, duplicatesIndexes);
        }
      } else {
        objectKeyList = Object.keys(object);

        for (index = 0, length = objectKeyList.length; index < length; index += 1) {
          inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
        }
      }
    }
  }
}

function dump(input, options) {
  options = options || {};

  var state = new State(options);

  if (!state.noRefs) getDuplicateReferences(input, state);

  var value = input;

  if (state.replacer) {
    value = state.replacer.call({ '': value }, '', value);
  }

  if (writeNode(state, 0, value, true, true)) return state.dump + '\n';

  return '';
}

module.exports.dump = dump;


/***/ }),

/***/ 1248:
/***/ ((module) => {

// YAML error class. http://stackoverflow.com/questions/8458984
//



function formatError(exception, compact) {
  var where = '', message = exception.reason || '(unknown reason)';

  if (!exception.mark) return message;

  if (exception.mark.name) {
    where += 'in "' + exception.mark.name + '" ';
  }

  where += '(' + (exception.mark.line + 1) + ':' + (exception.mark.column + 1) + ')';

  if (!compact && exception.mark.snippet) {
    where += '\n\n' + exception.mark.snippet;
  }

  return message + ' ' + where;
}


function YAMLException(reason, mark) {
  // Super constructor
  Error.call(this);

  this.name = 'YAMLException';
  this.reason = reason;
  this.mark = mark;
  this.message = formatError(this, false);

  // Include stack trace in error object
  if (Error.captureStackTrace) {
    // Chrome and NodeJS
    Error.captureStackTrace(this, this.constructor);
  } else {
    // FF, IE 10+ and Safari 6+. Fallback for others
    this.stack = (new Error()).stack || '';
  }
}


// Inherit from Error
YAMLException.prototype = Object.create(Error.prototype);
YAMLException.prototype.constructor = YAMLException;


YAMLException.prototype.toString = function toString(compact) {
  return this.name + ': ' + formatError(this, compact);
};


module.exports = YAMLException;


/***/ }),

/***/ 1950:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



/*eslint-disable max-len,no-use-before-define*/

var common              = __nccwpck_require__(9816);
var YAMLException       = __nccwpck_require__(1248);
var makeSnippet         = __nccwpck_require__(9440);
var DEFAULT_SCHEMA      = __nccwpck_require__(7336);


var _hasOwnProperty = Object.prototype.hasOwnProperty;


var CONTEXT_FLOW_IN   = 1;
var CONTEXT_FLOW_OUT  = 2;
var CONTEXT_BLOCK_IN  = 3;
var CONTEXT_BLOCK_OUT = 4;


var CHOMPING_CLIP  = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP  = 3;


var PATTERN_NON_PRINTABLE         = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS       = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE            = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI               = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;


function _class(obj) { return Object.prototype.toString.call(obj); }

function is_EOL(c) {
  return (c === 0x0A/* LF */) || (c === 0x0D/* CR */);
}

function is_WHITE_SPACE(c) {
  return (c === 0x09/* Tab */) || (c === 0x20/* Space */);
}

function is_WS_OR_EOL(c) {
  return (c === 0x09/* Tab */) ||
         (c === 0x20/* Space */) ||
         (c === 0x0A/* LF */) ||
         (c === 0x0D/* CR */);
}

function is_FLOW_INDICATOR(c) {
  return c === 0x2C/* , */ ||
         c === 0x5B/* [ */ ||
         c === 0x5D/* ] */ ||
         c === 0x7B/* { */ ||
         c === 0x7D/* } */;
}

function fromHexCode(c) {
  var lc;

  if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
    return c - 0x30;
  }

  /*eslint-disable no-bitwise*/
  lc = c | 0x20;

  if ((0x61/* a */ <= lc) && (lc <= 0x66/* f */)) {
    return lc - 0x61 + 10;
  }

  return -1;
}

function escapedHexLen(c) {
  if (c === 0x78/* x */) { return 2; }
  if (c === 0x75/* u */) { return 4; }
  if (c === 0x55/* U */) { return 8; }
  return 0;
}

function fromDecimalCode(c) {
  if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
    return c - 0x30;
  }

  return -1;
}

function simpleEscapeSequence(c) {
  /* eslint-disable indent */
  return (c === 0x30/* 0 */) ? '\x00' :
        (c === 0x61/* a */) ? '\x07' :
        (c === 0x62/* b */) ? '\x08' :
        (c === 0x74/* t */) ? '\x09' :
        (c === 0x09/* Tab */) ? '\x09' :
        (c === 0x6E/* n */) ? '\x0A' :
        (c === 0x76/* v */) ? '\x0B' :
        (c === 0x66/* f */) ? '\x0C' :
        (c === 0x72/* r */) ? '\x0D' :
        (c === 0x65/* e */) ? '\x1B' :
        (c === 0x20/* Space */) ? ' ' :
        (c === 0x22/* " */) ? '\x22' :
        (c === 0x2F/* / */) ? '/' :
        (c === 0x5C/* \ */) ? '\x5C' :
        (c === 0x4E/* N */) ? '\x85' :
        (c === 0x5F/* _ */) ? '\xA0' :
        (c === 0x4C/* L */) ? '\u2028' :
        (c === 0x50/* P */) ? '\u2029' : '';
}

function charFromCodepoint(c) {
  if (c <= 0xFFFF) {
    return String.fromCharCode(c);
  }
  // Encode UTF-16 surrogate pair
  // https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF
  return String.fromCharCode(
    ((c - 0x010000) >> 10) + 0xD800,
    ((c - 0x010000) & 0x03FF) + 0xDC00
  );
}

// set a property of a literal object, while protecting against prototype pollution,
// see https://github.com/nodeca/js-yaml/issues/164 for more details
function setProperty(object, key, value) {
  // used for this specific key only because Object.defineProperty is slow
  if (key === '__proto__') {
    Object.defineProperty(object, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: value
    });
  } else {
    object[key] = value;
  }
}

var simpleEscapeCheck = new Array(256); // integer, for fast access
var simpleEscapeMap = new Array(256);
for (var i = 0; i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}


function State(input, options) {
  this.input = input;

  this.filename  = options['filename']  || null;
  this.schema    = options['schema']    || DEFAULT_SCHEMA;
  this.onWarning = options['onWarning'] || null;
  // (Hidden) Remove? makes the loader to expect YAML 1.1 documents
  // if such documents have no explicit %YAML directive
  this.legacy    = options['legacy']    || false;

  this.json      = options['json']      || false;
  this.listener  = options['listener']  || null;

  this.implicitTypes = this.schema.compiledImplicit;
  this.typeMap       = this.schema.compiledTypeMap;

  this.length     = input.length;
  this.position   = 0;
  this.line       = 0;
  this.lineStart  = 0;
  this.lineIndent = 0;

  // position of first leading tab in the current line,
  // used to make sure there are no tabs in the indentation
  this.firstTabInLine = -1;

  this.documents = [];

  /*
  this.version;
  this.checkLineBreaks;
  this.tagMap;
  this.anchorMap;
  this.tag;
  this.anchor;
  this.kind;
  this.result;*/

}


function generateError(state, message) {
  var mark = {
    name:     state.filename,
    buffer:   state.input.slice(0, -1), // omit trailing \0
    position: state.position,
    line:     state.line,
    column:   state.position - state.lineStart
  };

  mark.snippet = makeSnippet(mark);

  return new YAMLException(message, mark);
}

function throwError(state, message) {
  throw generateError(state, message);
}

function throwWarning(state, message) {
  if (state.onWarning) {
    state.onWarning.call(null, generateError(state, message));
  }
}


var directiveHandlers = {

  YAML: function handleYamlDirective(state, name, args) {

    var match, major, minor;

    if (state.version !== null) {
      throwError(state, 'duplication of %YAML directive');
    }

    if (args.length !== 1) {
      throwError(state, 'YAML directive accepts exactly one argument');
    }

    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

    if (match === null) {
      throwError(state, 'ill-formed argument of the YAML directive');
    }

    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);

    if (major !== 1) {
      throwError(state, 'unacceptable YAML version of the document');
    }

    state.version = args[0];
    state.checkLineBreaks = (minor < 2);

    if (minor !== 1 && minor !== 2) {
      throwWarning(state, 'unsupported YAML version of the document');
    }
  },

  TAG: function handleTagDirective(state, name, args) {

    var handle, prefix;

    if (args.length !== 2) {
      throwError(state, 'TAG directive accepts exactly two arguments');
    }

    handle = args[0];
    prefix = args[1];

    if (!PATTERN_TAG_HANDLE.test(handle)) {
      throwError(state, 'ill-formed tag handle (first argument) of the TAG directive');
    }

    if (_hasOwnProperty.call(state.tagMap, handle)) {
      throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
    }

    if (!PATTERN_TAG_URI.test(prefix)) {
      throwError(state, 'ill-formed tag prefix (second argument) of the TAG directive');
    }

    try {
      prefix = decodeURIComponent(prefix);
    } catch (err) {
      throwError(state, 'tag prefix is malformed: ' + prefix);
    }

    state.tagMap[handle] = prefix;
  }
};


function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;

  if (start < end) {
    _result = state.input.slice(start, end);

    if (checkJson) {
      for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(_character === 0x09 ||
              (0x20 <= _character && _character <= 0x10FFFF))) {
          throwError(state, 'expected valid JSON character');
        }
      }
    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
      throwError(state, 'the stream contains non-printable characters');
    }

    state.result += _result;
  }
}

function mergeMappings(state, destination, source, overridableKeys) {
  var sourceKeys, key, index, quantity;

  if (!common.isObject(source)) {
    throwError(state, 'cannot merge mappings; the provided source object is unacceptable');
  }

  sourceKeys = Object.keys(source);

  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
    key = sourceKeys[index];

    if (!_hasOwnProperty.call(destination, key)) {
      setProperty(destination, key, source[key]);
      overridableKeys[key] = true;
    }
  }
}

function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode,
  startLine, startLineStart, startPos) {

  var index, quantity;

  // The output is a plain object here, so keys can only be strings.
  // We need to convert keyNode to a string, but doing so can hang the process
  // (deeply nested arrays that explode exponentially using aliases).
  if (Array.isArray(keyNode)) {
    keyNode = Array.prototype.slice.call(keyNode);

    for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
      if (Array.isArray(keyNode[index])) {
        throwError(state, 'nested arrays are not supported inside keys');
      }

      if (typeof keyNode === 'object' && _class(keyNode[index]) === '[object Object]') {
        keyNode[index] = '[object Object]';
      }
    }
  }

  // Avoid code execution in load() via toString property
  // (still use its own toString for arrays, timestamps,
  // and whatever user schema extensions happen to have @@toStringTag)
  if (typeof keyNode === 'object' && _class(keyNode) === '[object Object]') {
    keyNode = '[object Object]';
  }


  keyNode = String(keyNode);

  if (_result === null) {
    _result = {};
  }

  if (keyTag === 'tag:yaml.org,2002:merge') {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index], overridableKeys);
      }
    } else {
      mergeMappings(state, _result, valueNode, overridableKeys);
    }
  } else {
    if (!state.json &&
        !_hasOwnProperty.call(overridableKeys, keyNode) &&
        _hasOwnProperty.call(_result, keyNode)) {
      state.line = startLine || state.line;
      state.lineStart = startLineStart || state.lineStart;
      state.position = startPos || state.position;
      throwError(state, 'duplicated mapping key');
    }

    setProperty(_result, keyNode, valueNode);
    delete overridableKeys[keyNode];
  }

  return _result;
}

function readLineBreak(state) {
  var ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x0A/* LF */) {
    state.position++;
  } else if (ch === 0x0D/* CR */) {
    state.position++;
    if (state.input.charCodeAt(state.position) === 0x0A/* LF */) {
      state.position++;
    }
  } else {
    throwError(state, 'a line break is expected');
  }

  state.line += 1;
  state.lineStart = state.position;
  state.firstTabInLine = -1;
}

function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0,
      ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    while (is_WHITE_SPACE(ch)) {
      if (ch === 0x09/* Tab */ && state.firstTabInLine === -1) {
        state.firstTabInLine = state.position;
      }
      ch = state.input.charCodeAt(++state.position);
    }

    if (allowComments && ch === 0x23/* # */) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0x0A/* LF */ && ch !== 0x0D/* CR */ && ch !== 0);
    }

    if (is_EOL(ch)) {
      readLineBreak(state);

      ch = state.input.charCodeAt(state.position);
      lineBreaks++;
      state.lineIndent = 0;

      while (ch === 0x20/* Space */) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
    } else {
      break;
    }
  }

  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
    throwWarning(state, 'deficient indentation');
  }

  return lineBreaks;
}

function testDocumentSeparator(state) {
  var _position = state.position,
      ch;

  ch = state.input.charCodeAt(_position);

  // Condition state.position === state.lineStart is tested
  // in parent on each call, for efficiency. No needs to test here again.
  if ((ch === 0x2D/* - */ || ch === 0x2E/* . */) &&
      ch === state.input.charCodeAt(_position + 1) &&
      ch === state.input.charCodeAt(_position + 2)) {

    _position += 3;

    ch = state.input.charCodeAt(_position);

    if (ch === 0 || is_WS_OR_EOL(ch)) {
      return true;
    }
  }

  return false;
}

function writeFoldedLines(state, count) {
  if (count === 1) {
    state.result += ' ';
  } else if (count > 1) {
    state.result += common.repeat('\n', count - 1);
  }
}


function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding,
      following,
      captureStart,
      captureEnd,
      hasPendingContent,
      _line,
      _lineStart,
      _lineIndent,
      _kind = state.kind,
      _result = state.result,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (is_WS_OR_EOL(ch)      ||
      is_FLOW_INDICATOR(ch) ||
      ch === 0x23/* # */    ||
      ch === 0x26/* & */    ||
      ch === 0x2A/* * */    ||
      ch === 0x21/* ! */    ||
      ch === 0x7C/* | */    ||
      ch === 0x3E/* > */    ||
      ch === 0x27/* ' */    ||
      ch === 0x22/* " */    ||
      ch === 0x25/* % */    ||
      ch === 0x40/* @ */    ||
      ch === 0x60/* ` */) {
    return false;
  }

  if (ch === 0x3F/* ? */ || ch === 0x2D/* - */) {
    following = state.input.charCodeAt(state.position + 1);

    if (is_WS_OR_EOL(following) ||
        withinFlowCollection && is_FLOW_INDICATOR(following)) {
      return false;
    }
  }

  state.kind = 'scalar';
  state.result = '';
  captureStart = captureEnd = state.position;
  hasPendingContent = false;

  while (ch !== 0) {
    if (ch === 0x3A/* : */) {
      following = state.input.charCodeAt(state.position + 1);

      if (is_WS_OR_EOL(following) ||
          withinFlowCollection && is_FLOW_INDICATOR(following)) {
        break;
      }

    } else if (ch === 0x23/* # */) {
      preceding = state.input.charCodeAt(state.position - 1);

      if (is_WS_OR_EOL(preceding)) {
        break;
      }

    } else if ((state.position === state.lineStart && testDocumentSeparator(state)) ||
               withinFlowCollection && is_FLOW_INDICATOR(ch)) {
      break;

    } else if (is_EOL(ch)) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);

      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        break;
      }
    }

    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }

    if (!is_WHITE_SPACE(ch)) {
      captureEnd = state.position + 1;
    }

    ch = state.input.charCodeAt(++state.position);
  }

  captureSegment(state, captureStart, captureEnd, false);

  if (state.result) {
    return true;
  }

  state.kind = _kind;
  state.result = _result;
  return false;
}

function readSingleQuotedScalar(state, nodeIndent) {
  var ch,
      captureStart, captureEnd;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x27/* ' */) {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';
  state.position++;
  captureStart = captureEnd = state.position;

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 0x27/* ' */) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);

      if (ch === 0x27/* ' */) {
        captureStart = state.position;
        state.position++;
        captureEnd = state.position;
      } else {
        return true;
      }

    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;

    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a single quoted scalar');

    } else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a single quoted scalar');
}

function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart,
      captureEnd,
      hexLength,
      hexResult,
      tmp,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x22/* " */) {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';
  state.position++;
  captureStart = captureEnd = state.position;

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 0x22/* " */) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;

    } else if (ch === 0x5C/* \ */) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);

      if (is_EOL(ch)) {
        skipSeparationSpace(state, false, nodeIndent);

        // TODO: rework to inline fn with no type cast?
      } else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;

      } else if ((tmp = escapedHexLen(ch)) > 0) {
        hexLength = tmp;
        hexResult = 0;

        for (; hexLength > 0; hexLength--) {
          ch = state.input.charCodeAt(++state.position);

          if ((tmp = fromHexCode(ch)) >= 0) {
            hexResult = (hexResult << 4) + tmp;

          } else {
            throwError(state, 'expected hexadecimal character');
          }
        }

        state.result += charFromCodepoint(hexResult);

        state.position++;

      } else {
        throwError(state, 'unknown escape sequence');
      }

      captureStart = captureEnd = state.position;

    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;

    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a double quoted scalar');

    } else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a double quoted scalar');
}

function readFlowCollection(state, nodeIndent) {
  var readNext = true,
      _line,
      _lineStart,
      _pos,
      _tag     = state.tag,
      _result,
      _anchor  = state.anchor,
      following,
      terminator,
      isPair,
      isExplicitPair,
      isMapping,
      overridableKeys = Object.create(null),
      keyNode,
      keyTag,
      valueNode,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x5B/* [ */) {
    terminator = 0x5D;/* ] */
    isMapping = false;
    _result = [];
  } else if (ch === 0x7B/* { */) {
    terminator = 0x7D;/* } */
    isMapping = true;
    _result = {};
  } else {
    return false;
  }

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(++state.position);

  while (ch !== 0) {
    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if (ch === terminator) {
      state.position++;
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = isMapping ? 'mapping' : 'sequence';
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, 'missed comma between flow collection entries');
    } else if (ch === 0x2C/* , */) {
      // "flow collection entries can never be completely empty", as per YAML 1.2, section 7.4
      throwError(state, "expected the node content, but found ','");
    }

    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;

    if (ch === 0x3F/* ? */) {
      following = state.input.charCodeAt(state.position + 1);

      if (is_WS_OR_EOL(following)) {
        isPair = isExplicitPair = true;
        state.position++;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }

    _line = state.line; // Save the current line.
    _lineStart = state.lineStart;
    _pos = state.position;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if ((isExplicitPair || state.line === _line) && ch === 0x3A/* : */) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }

    if (isMapping) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
    } else {
      _result.push(keyNode);
    }

    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if (ch === 0x2C/* , */) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }

  throwError(state, 'unexpected end of the stream within a flow collection');
}

function readBlockScalar(state, nodeIndent) {
  var captureStart,
      folding,
      chomping       = CHOMPING_CLIP,
      didReadContent = false,
      detectedIndent = false,
      textIndent     = nodeIndent,
      emptyLines     = 0,
      atMoreIndented = false,
      tmp,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x7C/* | */) {
    folding = false;
  } else if (ch === 0x3E/* > */) {
    folding = true;
  } else {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';

  while (ch !== 0) {
    ch = state.input.charCodeAt(++state.position);

    if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
      if (CHOMPING_CLIP === chomping) {
        chomping = (ch === 0x2B/* + */) ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, 'repeat of a chomping mode identifier');
      }

    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
      if (tmp === 0) {
        throwError(state, 'bad explicit indentation width of a block scalar; it cannot be less than one');
      } else if (!detectedIndent) {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      } else {
        throwError(state, 'repeat of an indentation width identifier');
      }

    } else {
      break;
    }
  }

  if (is_WHITE_SPACE(ch)) {
    do { ch = state.input.charCodeAt(++state.position); }
    while (is_WHITE_SPACE(ch));

    if (ch === 0x23/* # */) {
      do { ch = state.input.charCodeAt(++state.position); }
      while (!is_EOL(ch) && (ch !== 0));
    }
  }

  while (ch !== 0) {
    readLineBreak(state);
    state.lineIndent = 0;

    ch = state.input.charCodeAt(state.position);

    while ((!detectedIndent || state.lineIndent < textIndent) &&
           (ch === 0x20/* Space */)) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }

    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }

    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    }

    // End of the scalar.
    if (state.lineIndent < textIndent) {

      // Perform the chomping.
      if (chomping === CHOMPING_KEEP) {
        state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
      } else if (chomping === CHOMPING_CLIP) {
        if (didReadContent) { // i.e. only if the scalar is not empty.
          state.result += '\n';
        }
      }

      // Break this `while` cycle and go to the funciton's epilogue.
      break;
    }

    // Folded style: use fancy rules to handle line breaks.
    if (folding) {

      // Lines starting with white space characters (more-indented lines) are not folded.
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true;
        // except for the first content line (cf. Example 8.1)
        state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);

      // End of more-indented block.
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common.repeat('\n', emptyLines + 1);

      // Just one line break - perceive as the same line.
      } else if (emptyLines === 0) {
        if (didReadContent) { // i.e. only if we have already read some scalar content.
          state.result += ' ';
        }

      // Several line breaks - perceive as different lines.
      } else {
        state.result += common.repeat('\n', emptyLines);
      }

    // Literal style: just add exact number of line breaks between content lines.
    } else {
      // Keep all line breaks except the header line break.
      state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
    }

    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;

    while (!is_EOL(ch) && (ch !== 0)) {
      ch = state.input.charCodeAt(++state.position);
    }

    captureSegment(state, captureStart, state.position, false);
  }

  return true;
}

function readBlockSequence(state, nodeIndent) {
  var _line,
      _tag      = state.tag,
      _anchor   = state.anchor,
      _result   = [],
      following,
      detected  = false,
      ch;

  // there is a leading tab before this token, so it can't be a block sequence/mapping;
  // it can still be flow sequence/mapping or a scalar
  if (state.firstTabInLine !== -1) return false;

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, 'tab characters must not be used in indentation');
    }

    if (ch !== 0x2D/* - */) {
      break;
    }

    following = state.input.charCodeAt(state.position + 1);

    if (!is_WS_OR_EOL(following)) {
      break;
    }

    detected = true;
    state.position++;

    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);
        ch = state.input.charCodeAt(state.position);
        continue;
      }
    }

    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);

    ch = state.input.charCodeAt(state.position);

    if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
      throwError(state, 'bad indentation of a sequence entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = 'sequence';
    state.result = _result;
    return true;
  }
  return false;
}

function readBlockMapping(state, nodeIndent, flowIndent) {
  var following,
      allowCompact,
      _line,
      _keyLine,
      _keyLineStart,
      _keyPos,
      _tag          = state.tag,
      _anchor       = state.anchor,
      _result       = {},
      overridableKeys = Object.create(null),
      keyTag        = null,
      keyNode       = null,
      valueNode     = null,
      atExplicitKey = false,
      detected      = false,
      ch;

  // there is a leading tab before this token, so it can't be a block sequence/mapping;
  // it can still be flow sequence/mapping or a scalar
  if (state.firstTabInLine !== -1) return false;

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, 'tab characters must not be used in indentation');
    }

    following = state.input.charCodeAt(state.position + 1);
    _line = state.line; // Save the current line.

    //
    // Explicit notation case. There are two separate blocks:
    // first for the key (denoted by "?") and second for the value (denoted by ":")
    //
    if ((ch === 0x3F/* ? */ || ch === 0x3A/* : */) && is_WS_OR_EOL(following)) {

      if (ch === 0x3F/* ? */) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }

        detected = true;
        atExplicitKey = true;
        allowCompact = true;

      } else if (atExplicitKey) {
        // i.e. 0x3A/* : */ === character after the explicit key.
        atExplicitKey = false;
        allowCompact = true;

      } else {
        throwError(state, 'incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line');
      }

      state.position += 1;
      ch = following;

    //
    // Implicit notation case. Flow-style node as the key first, then ":", and the value.
    //
    } else {
      _keyLine = state.line;
      _keyLineStart = state.lineStart;
      _keyPos = state.position;

      if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
        // Neither implicit nor explicit notation.
        // Reading is done. Go to the epilogue.
        break;
      }

      if (state.line === _line) {
        ch = state.input.charCodeAt(state.position);

        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }

        if (ch === 0x3A/* : */) {
          ch = state.input.charCodeAt(++state.position);

          if (!is_WS_OR_EOL(ch)) {
            throwError(state, 'a whitespace character is expected after the key-value separator within a block mapping');
          }

          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }

          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;

        } else if (detected) {
          throwError(state, 'can not read an implicit mapping pair; a colon is missed');

        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true; // Keep the result of `composeNode`.
        }

      } else if (detected) {
        throwError(state, 'can not read a block mapping entry; a multiline key may not be an implicit key');

      } else {
        state.tag = _tag;
        state.anchor = _anchor;
        return true; // Keep the result of `composeNode`.
      }
    }

    //
    // Common reading code for both explicit and implicit notations.
    //
    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (atExplicitKey) {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
      }

      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }

      if (!atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
        keyTag = keyNode = valueNode = null;
      }

      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }

    if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
      throwError(state, 'bad indentation of a mapping entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  //
  // Epilogue.
  //

  // Special case: last mapping's node contains only the key in explicit notation.
  if (atExplicitKey) {
    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
  }

  // Expose the resulting mapping.
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = 'mapping';
    state.result = _result;
  }

  return detected;
}

function readTagProperty(state) {
  var _position,
      isVerbatim = false,
      isNamed    = false,
      tagHandle,
      tagName,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x21/* ! */) return false;

  if (state.tag !== null) {
    throwError(state, 'duplication of a tag property');
  }

  ch = state.input.charCodeAt(++state.position);

  if (ch === 0x3C/* < */) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);

  } else if (ch === 0x21/* ! */) {
    isNamed = true;
    tagHandle = '!!';
    ch = state.input.charCodeAt(++state.position);

  } else {
    tagHandle = '!';
  }

  _position = state.position;

  if (isVerbatim) {
    do { ch = state.input.charCodeAt(++state.position); }
    while (ch !== 0 && ch !== 0x3E/* > */);

    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, 'unexpected end of the stream within a verbatim tag');
    }
  } else {
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {

      if (ch === 0x21/* ! */) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);

          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, 'named tag handle cannot contain such characters');
          }

          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, 'tag suffix cannot contain exclamation marks');
        }
      }

      ch = state.input.charCodeAt(++state.position);
    }

    tagName = state.input.slice(_position, state.position);

    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, 'tag suffix cannot contain flow indicator characters');
    }
  }

  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, 'tag name cannot contain such characters: ' + tagName);
  }

  try {
    tagName = decodeURIComponent(tagName);
  } catch (err) {
    throwError(state, 'tag name is malformed: ' + tagName);
  }

  if (isVerbatim) {
    state.tag = tagName;

  } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;

  } else if (tagHandle === '!') {
    state.tag = '!' + tagName;

  } else if (tagHandle === '!!') {
    state.tag = 'tag:yaml.org,2002:' + tagName;

  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }

  return true;
}

function readAnchorProperty(state) {
  var _position,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x26/* & */) return false;

  if (state.anchor !== null) {
    throwError(state, 'duplication of an anchor property');
  }

  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an anchor node must contain at least one character');
  }

  state.anchor = state.input.slice(_position, state.position);
  return true;
}

function readAlias(state) {
  var _position, alias,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x2A/* * */) return false;

  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an alias node must contain at least one character');
  }

  alias = state.input.slice(_position, state.position);

  if (!_hasOwnProperty.call(state.anchorMap, alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }

  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}

function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles,
      allowBlockScalars,
      allowBlockCollections,
      indentStatus = 1, // 1: this>parent, 0: this=parent, -1: this<parent
      atNewLine  = false,
      hasContent = false,
      typeIndex,
      typeQuantity,
      typeList,
      type,
      flowIndent,
      blockIndent;

  if (state.listener !== null) {
    state.listener('open', state);
  }

  state.tag    = null;
  state.anchor = null;
  state.kind   = null;
  state.result = null;

  allowBlockStyles = allowBlockScalars = allowBlockCollections =
    CONTEXT_BLOCK_OUT === nodeContext ||
    CONTEXT_BLOCK_IN  === nodeContext;

  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;

      if (state.lineIndent > parentIndent) {
        indentStatus = 1;
      } else if (state.lineIndent === parentIndent) {
        indentStatus = 0;
      } else if (state.lineIndent < parentIndent) {
        indentStatus = -1;
      }
    }
  }

  if (indentStatus === 1) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;

        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }

  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }

  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }

    blockIndent = state.position - state.lineStart;

    if (indentStatus === 1) {
      if (allowBlockCollections &&
          (readBlockSequence(state, blockIndent) ||
           readBlockMapping(state, blockIndent, flowIndent)) ||
          readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if ((allowBlockScalars && readBlockScalar(state, flowIndent)) ||
            readSingleQuotedScalar(state, flowIndent) ||
            readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;

        } else if (readAlias(state)) {
          hasContent = true;

          if (state.tag !== null || state.anchor !== null) {
            throwError(state, 'alias node should not have any properties');
          }

        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;

          if (state.tag === null) {
            state.tag = '?';
          }
        }

        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else if (indentStatus === 0) {
      // Special case: block sequences are allowed to have same indentation level as the parent.
      // http://www.yaml.org/spec/1.2/spec.html#id2799784
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }

  if (state.tag === null) {
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = state.result;
    }

  } else if (state.tag === '?') {
    // Implicit resolving is not allowed for non-scalar types, and '?'
    // non-specific tag is only automatically assigned to plain scalars.
    //
    // We only need to check kind conformity in case user explicitly assigns '?'
    // tag, for example like this: "!<?> [0]"
    //
    if (state.result !== null && state.kind !== 'scalar') {
      throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
    }

    for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
      type = state.implicitTypes[typeIndex];

      if (type.resolve(state.result)) { // `state.result` updated in resolver if matched
        state.result = type.construct(state.result);
        state.tag = type.tag;
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
        break;
      }
    }
  } else if (state.tag !== '!') {
    if (_hasOwnProperty.call(state.typeMap[state.kind || 'fallback'], state.tag)) {
      type = state.typeMap[state.kind || 'fallback'][state.tag];
    } else {
      // looking for multi type
      type = null;
      typeList = state.typeMap.multi[state.kind || 'fallback'];

      for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
        if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
          type = typeList[typeIndex];
          break;
        }
      }
    }

    if (!type) {
      throwError(state, 'unknown tag !<' + state.tag + '>');
    }

    if (state.result !== null && type.kind !== state.kind) {
      throwError(state, 'unacceptable node kind for !<' + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
    }

    if (!type.resolve(state.result, state.tag)) { // `state.result` updated in resolver if matched
      throwError(state, 'cannot resolve a node with !<' + state.tag + '> explicit tag');
    } else {
      state.result = type.construct(state.result, state.tag);
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = state.result;
      }
    }
  }

  if (state.listener !== null) {
    state.listener('close', state);
  }
  return state.tag !== null ||  state.anchor !== null || hasContent;
}

function readDocument(state) {
  var documentStart = state.position,
      _position,
      directiveName,
      directiveArgs,
      hasDirectives = false,
      ch;

  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = Object.create(null);
  state.anchorMap = Object.create(null);

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    skipSeparationSpace(state, true, -1);

    ch = state.input.charCodeAt(state.position);

    if (state.lineIndent > 0 || ch !== 0x25/* % */) {
      break;
    }

    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;

    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }

    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];

    if (directiveName.length < 1) {
      throwError(state, 'directive name must not be less than one character in length');
    }

    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      if (ch === 0x23/* # */) {
        do { ch = state.input.charCodeAt(++state.position); }
        while (ch !== 0 && !is_EOL(ch));
        break;
      }

      if (is_EOL(ch)) break;

      _position = state.position;

      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      directiveArgs.push(state.input.slice(_position, state.position));
    }

    if (ch !== 0) readLineBreak(state);

    if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }

  skipSeparationSpace(state, true, -1);

  if (state.lineIndent === 0 &&
      state.input.charCodeAt(state.position)     === 0x2D/* - */ &&
      state.input.charCodeAt(state.position + 1) === 0x2D/* - */ &&
      state.input.charCodeAt(state.position + 2) === 0x2D/* - */) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);

  } else if (hasDirectives) {
    throwError(state, 'directives end mark is expected');
  }

  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);

  if (state.checkLineBreaks &&
      PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, 'non-ASCII line breaks are interpreted as content');
  }

  state.documents.push(state.result);

  if (state.position === state.lineStart && testDocumentSeparator(state)) {

    if (state.input.charCodeAt(state.position) === 0x2E/* . */) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }
    return;
  }

  if (state.position < (state.length - 1)) {
    throwError(state, 'end of the stream or a document separator is expected');
  } else {
    return;
  }
}


function loadDocuments(input, options) {
  input = String(input);
  options = options || {};

  if (input.length !== 0) {

    // Add tailing `\n` if not exists
    if (input.charCodeAt(input.length - 1) !== 0x0A/* LF */ &&
        input.charCodeAt(input.length - 1) !== 0x0D/* CR */) {
      input += '\n';
    }

    // Strip BOM
    if (input.charCodeAt(0) === 0xFEFF) {
      input = input.slice(1);
    }
  }

  var state = new State(input, options);

  var nullpos = input.indexOf('\0');

  if (nullpos !== -1) {
    state.position = nullpos;
    throwError(state, 'null byte is not allowed in input');
  }

  // Use 0 as string terminator. That significantly simplifies bounds check.
  state.input += '\0';

  while (state.input.charCodeAt(state.position) === 0x20/* Space */) {
    state.lineIndent += 1;
    state.position += 1;
  }

  while (state.position < (state.length - 1)) {
    readDocument(state);
  }

  return state.documents;
}


function loadAll(input, iterator, options) {
  if (iterator !== null && typeof iterator === 'object' && typeof options === 'undefined') {
    options = iterator;
    iterator = null;
  }

  var documents = loadDocuments(input, options);

  if (typeof iterator !== 'function') {
    return documents;
  }

  for (var index = 0, length = documents.length; index < length; index += 1) {
    iterator(documents[index]);
  }
}


function load(input, options) {
  var documents = loadDocuments(input, options);

  if (documents.length === 0) {
    /*eslint-disable no-undefined*/
    return undefined;
  } else if (documents.length === 1) {
    return documents[0];
  }
  throw new YAMLException('expected a single document in the stream, but found more');
}


module.exports.loadAll = loadAll;
module.exports.load    = load;


/***/ }),

/***/ 2046:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



/*eslint-disable max-len*/

var YAMLException = __nccwpck_require__(1248);
var Type          = __nccwpck_require__(9557);


function compileList(schema, name) {
  var result = [];

  schema[name].forEach(function (currentType) {
    var newIndex = result.length;

    result.forEach(function (previousType, previousIndex) {
      if (previousType.tag === currentType.tag &&
          previousType.kind === currentType.kind &&
          previousType.multi === currentType.multi) {

        newIndex = previousIndex;
      }
    });

    result[newIndex] = currentType;
  });

  return result;
}


function compileMap(/* lists... */) {
  var result = {
        scalar: {},
        sequence: {},
        mapping: {},
        fallback: {},
        multi: {
          scalar: [],
          sequence: [],
          mapping: [],
          fallback: []
        }
      }, index, length;

  function collectType(type) {
    if (type.multi) {
      result.multi[type.kind].push(type);
      result.multi['fallback'].push(type);
    } else {
      result[type.kind][type.tag] = result['fallback'][type.tag] = type;
    }
  }

  for (index = 0, length = arguments.length; index < length; index += 1) {
    arguments[index].forEach(collectType);
  }
  return result;
}


function Schema(definition) {
  return this.extend(definition);
}


Schema.prototype.extend = function extend(definition) {
  var implicit = [];
  var explicit = [];

  if (definition instanceof Type) {
    // Schema.extend(type)
    explicit.push(definition);

  } else if (Array.isArray(definition)) {
    // Schema.extend([ type1, type2, ... ])
    explicit = explicit.concat(definition);

  } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
    // Schema.extend({ explicit: [ type1, type2, ... ], implicit: [ type1, type2, ... ] })
    if (definition.implicit) implicit = implicit.concat(definition.implicit);
    if (definition.explicit) explicit = explicit.concat(definition.explicit);

  } else {
    throw new YAMLException('Schema.extend argument should be a Type, [ Type ], ' +
      'or a schema definition ({ implicit: [...], explicit: [...] })');
  }

  implicit.forEach(function (type) {
    if (!(type instanceof Type)) {
      throw new YAMLException('Specified list of YAML types (or a single Type object) contains a non-Type object.');
    }

    if (type.loadKind && type.loadKind !== 'scalar') {
      throw new YAMLException('There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.');
    }

    if (type.multi) {
      throw new YAMLException('There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.');
    }
  });

  explicit.forEach(function (type) {
    if (!(type instanceof Type)) {
      throw new YAMLException('Specified list of YAML types (or a single Type object) contains a non-Type object.');
    }
  });

  var result = Object.create(Schema.prototype);

  result.implicit = (this.implicit || []).concat(implicit);
  result.explicit = (this.explicit || []).concat(explicit);

  result.compiledImplicit = compileList(result, 'implicit');
  result.compiledExplicit = compileList(result, 'explicit');
  result.compiledTypeMap  = compileMap(result.compiledImplicit, result.compiledExplicit);

  return result;
};


module.exports = Schema;


/***/ }),

/***/ 5746:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

// Standard YAML's Core schema.
// http://www.yaml.org/spec/1.2/spec.html#id2804923
//
// NOTE: JS-YAML does not support schema-specific tag resolution restrictions.
// So, Core schema has no distinctions from JSON schema is JS-YAML.





module.exports = __nccwpck_require__(8927);


/***/ }),

/***/ 7336:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

// JS-YAML's default schema for `safeLoad` function.
// It is not described in the YAML specification.
//
// This schema is based on standard YAML's Core schema and includes most of
// extra types described at YAML tag repository. (http://yaml.org/type/)





module.exports = (__nccwpck_require__(5746).extend)({
  implicit: [
    __nccwpck_require__(8966),
    __nccwpck_require__(6854)
  ],
  explicit: [
    __nccwpck_require__(8149),
    __nccwpck_require__(8649),
    __nccwpck_require__(6267),
    __nccwpck_require__(8758)
  ]
});


/***/ }),

/***/ 9832:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

// Standard YAML's Failsafe schema.
// http://www.yaml.org/spec/1.2/spec.html#id2802346





var Schema = __nccwpck_require__(2046);


module.exports = new Schema({
  explicit: [
    __nccwpck_require__(3929),
    __nccwpck_require__(7161),
    __nccwpck_require__(7316)
  ]
});


/***/ }),

/***/ 8927:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

// Standard YAML's JSON schema.
// http://www.yaml.org/spec/1.2/spec.html#id2803231
//
// NOTE: JS-YAML does not support schema-specific tag resolution restrictions.
// So, this schema is not such strict as defined in the YAML specification.
// It allows numbers in binary notaion, use `Null` and `NULL` as `null`, etc.





module.exports = (__nccwpck_require__(9832).extend)({
  implicit: [
    __nccwpck_require__(4333),
    __nccwpck_require__(7296),
    __nccwpck_require__(4652),
    __nccwpck_require__(7584)
  ]
});


/***/ }),

/***/ 9440:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {




var common = __nccwpck_require__(9816);


// get snippet for a single line, respecting maxLength
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
  var head = '';
  var tail = '';
  var maxHalfLength = Math.floor(maxLineLength / 2) - 1;

  if (position - lineStart > maxHalfLength) {
    head = ' ... ';
    lineStart = position - maxHalfLength + head.length;
  }

  if (lineEnd - position > maxHalfLength) {
    tail = ' ...';
    lineEnd = position + maxHalfLength - tail.length;
  }

  return {
    str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, '→') + tail,
    pos: position - lineStart + head.length // relative position
  };
}


function padStart(string, max) {
  return common.repeat(' ', max - string.length) + string;
}


function makeSnippet(mark, options) {
  options = Object.create(options || null);

  if (!mark.buffer) return null;

  if (!options.maxLength) options.maxLength = 79;
  if (typeof options.indent      !== 'number') options.indent      = 1;
  if (typeof options.linesBefore !== 'number') options.linesBefore = 3;
  if (typeof options.linesAfter  !== 'number') options.linesAfter  = 2;

  var re = /\r?\n|\r|\0/g;
  var lineStarts = [ 0 ];
  var lineEnds = [];
  var match;
  var foundLineNo = -1;

  while ((match = re.exec(mark.buffer))) {
    lineEnds.push(match.index);
    lineStarts.push(match.index + match[0].length);

    if (mark.position <= match.index && foundLineNo < 0) {
      foundLineNo = lineStarts.length - 2;
    }
  }

  if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;

  var result = '', i, line;
  var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
  var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);

  for (i = 1; i <= options.linesBefore; i++) {
    if (foundLineNo - i < 0) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo - i],
      lineEnds[foundLineNo - i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
      maxLineLength
    );
    result = common.repeat(' ', options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) +
      ' | ' + line.str + '\n' + result;
  }

  line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
  result += common.repeat(' ', options.indent) + padStart((mark.line + 1).toString(), lineNoLength) +
    ' | ' + line.str + '\n';
  result += common.repeat('-', options.indent + lineNoLength + 3 + line.pos) + '^' + '\n';

  for (i = 1; i <= options.linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo + i],
      lineEnds[foundLineNo + i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
      maxLineLength
    );
    result += common.repeat(' ', options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) +
      ' | ' + line.str + '\n';
  }

  return result.replace(/\n$/, '');
}


module.exports = makeSnippet;


/***/ }),

/***/ 9557:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



var YAMLException = __nccwpck_require__(1248);

var TYPE_CONSTRUCTOR_OPTIONS = [
  'kind',
  'multi',
  'resolve',
  'construct',
  'instanceOf',
  'predicate',
  'represent',
  'representName',
  'defaultStyle',
  'styleAliases'
];

var YAML_NODE_KINDS = [
  'scalar',
  'sequence',
  'mapping'
];

function compileStyleAliases(map) {
  var result = {};

  if (map !== null) {
    Object.keys(map).forEach(function (style) {
      map[style].forEach(function (alias) {
        result[String(alias)] = style;
      });
    });
  }

  return result;
}

function Type(tag, options) {
  options = options || {};

  Object.keys(options).forEach(function (name) {
    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
      throw new YAMLException('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
    }
  });

  // TODO: Add tag format check.
  this.options       = options; // keep original options in case user wants to extend this type later
  this.tag           = tag;
  this.kind          = options['kind']          || null;
  this.resolve       = options['resolve']       || function () { return true; };
  this.construct     = options['construct']     || function (data) { return data; };
  this.instanceOf    = options['instanceOf']    || null;
  this.predicate     = options['predicate']     || null;
  this.represent     = options['represent']     || null;
  this.representName = options['representName'] || null;
  this.defaultStyle  = options['defaultStyle']  || null;
  this.multi         = options['multi']         || false;
  this.styleAliases  = compileStyleAliases(options['styleAliases'] || null);

  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
    throw new YAMLException('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
  }
}

module.exports = Type;


/***/ }),

/***/ 8149:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



/*eslint-disable no-bitwise*/


var Type = __nccwpck_require__(9557);


// [ 64, 65, 66 ] -> [ padding, CR, LF ]
var BASE64_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r';


function resolveYamlBinary(data) {
  if (data === null) return false;

  var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;

  // Convert one by one.
  for (idx = 0; idx < max; idx++) {
    code = map.indexOf(data.charAt(idx));

    // Skip CR/LF
    if (code > 64) continue;

    // Fail on illegal characters
    if (code < 0) return false;

    bitlen += 6;
  }

  // If there are any bits left, source was corrupted
  return (bitlen % 8) === 0;
}

function constructYamlBinary(data) {
  var idx, tailbits,
      input = data.replace(/[\r\n=]/g, ''), // remove CR/LF & padding to simplify scan
      max = input.length,
      map = BASE64_MAP,
      bits = 0,
      result = [];

  // Collect by 6*4 bits (3 bytes)

  for (idx = 0; idx < max; idx++) {
    if ((idx % 4 === 0) && idx) {
      result.push((bits >> 16) & 0xFF);
      result.push((bits >> 8) & 0xFF);
      result.push(bits & 0xFF);
    }

    bits = (bits << 6) | map.indexOf(input.charAt(idx));
  }

  // Dump tail

  tailbits = (max % 4) * 6;

  if (tailbits === 0) {
    result.push((bits >> 16) & 0xFF);
    result.push((bits >> 8) & 0xFF);
    result.push(bits & 0xFF);
  } else if (tailbits === 18) {
    result.push((bits >> 10) & 0xFF);
    result.push((bits >> 2) & 0xFF);
  } else if (tailbits === 12) {
    result.push((bits >> 4) & 0xFF);
  }

  return new Uint8Array(result);
}

function representYamlBinary(object /*, style*/) {
  var result = '', bits = 0, idx, tail,
      max = object.length,
      map = BASE64_MAP;

  // Convert every three bytes to 4 ASCII characters.

  for (idx = 0; idx < max; idx++) {
    if ((idx % 3 === 0) && idx) {
      result += map[(bits >> 18) & 0x3F];
      result += map[(bits >> 12) & 0x3F];
      result += map[(bits >> 6) & 0x3F];
      result += map[bits & 0x3F];
    }

    bits = (bits << 8) + object[idx];
  }

  // Dump tail

  tail = max % 3;

  if (tail === 0) {
    result += map[(bits >> 18) & 0x3F];
    result += map[(bits >> 12) & 0x3F];
    result += map[(bits >> 6) & 0x3F];
    result += map[bits & 0x3F];
  } else if (tail === 2) {
    result += map[(bits >> 10) & 0x3F];
    result += map[(bits >> 4) & 0x3F];
    result += map[(bits << 2) & 0x3F];
    result += map[64];
  } else if (tail === 1) {
    result += map[(bits >> 2) & 0x3F];
    result += map[(bits << 4) & 0x3F];
    result += map[64];
    result += map[64];
  }

  return result;
}

function isBinary(obj) {
  return Object.prototype.toString.call(obj) ===  '[object Uint8Array]';
}

module.exports = new Type('tag:yaml.org,2002:binary', {
  kind: 'scalar',
  resolve: resolveYamlBinary,
  construct: constructYamlBinary,
  predicate: isBinary,
  represent: representYamlBinary
});


/***/ }),

/***/ 7296:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



var Type = __nccwpck_require__(9557);

function resolveYamlBoolean(data) {
  if (data === null) return false;

  var max = data.length;

  return (max === 4 && (data === 'true' || data === 'True' || data === 'TRUE')) ||
         (max === 5 && (data === 'false' || data === 'False' || data === 'FALSE'));
}

function constructYamlBoolean(data) {
  return data === 'true' ||
         data === 'True' ||
         data === 'TRUE';
}

function isBoolean(object) {
  return Object.prototype.toString.call(object) === '[object Boolean]';
}

module.exports = new Type('tag:yaml.org,2002:bool', {
  kind: 'scalar',
  resolve: resolveYamlBoolean,
  construct: constructYamlBoolean,
  predicate: isBoolean,
  represent: {
    lowercase: function (object) { return object ? 'true' : 'false'; },
    uppercase: function (object) { return object ? 'TRUE' : 'FALSE'; },
    camelcase: function (object) { return object ? 'True' : 'False'; }
  },
  defaultStyle: 'lowercase'
});


/***/ }),

/***/ 7584:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



var common = __nccwpck_require__(9816);
var Type   = __nccwpck_require__(9557);

var YAML_FLOAT_PATTERN = new RegExp(
  // 2.5e4, 2.5 and integers
  '^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?' +
  // .2e4, .2
  // special case, seems not from spec
  '|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?' +
  // .inf
  '|[-+]?\\.(?:inf|Inf|INF)' +
  // .nan
  '|\\.(?:nan|NaN|NAN))$');

function resolveYamlFloat(data) {
  if (data === null) return false;

  if (!YAML_FLOAT_PATTERN.test(data) ||
      // Quick hack to not allow integers end with `_`
      // Probably should update regexp & check speed
      data[data.length - 1] === '_') {
    return false;
  }

  return true;
}

function constructYamlFloat(data) {
  var value, sign;

  value  = data.replace(/_/g, '').toLowerCase();
  sign   = value[0] === '-' ? -1 : 1;

  if ('+-'.indexOf(value[0]) >= 0) {
    value = value.slice(1);
  }

  if (value === '.inf') {
    return (sign === 1) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

  } else if (value === '.nan') {
    return NaN;
  }
  return sign * parseFloat(value, 10);
}


var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;

function representYamlFloat(object, style) {
  var res;

  if (isNaN(object)) {
    switch (style) {
      case 'lowercase': return '.nan';
      case 'uppercase': return '.NAN';
      case 'camelcase': return '.NaN';
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
      case 'lowercase': return '.inf';
      case 'uppercase': return '.INF';
      case 'camelcase': return '.Inf';
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
      case 'lowercase': return '-.inf';
      case 'uppercase': return '-.INF';
      case 'camelcase': return '-.Inf';
    }
  } else if (common.isNegativeZero(object)) {
    return '-0.0';
  }

  res = object.toString(10);

  // JS stringifier can build scientific format without dots: 5e-100,
  // while YAML requres dot: 5.e-100. Fix it with simple hack

  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace('e', '.e') : res;
}

function isFloat(object) {
  return (Object.prototype.toString.call(object) === '[object Number]') &&
         (object % 1 !== 0 || common.isNegativeZero(object));
}

module.exports = new Type('tag:yaml.org,2002:float', {
  kind: 'scalar',
  resolve: resolveYamlFloat,
  construct: constructYamlFloat,
  predicate: isFloat,
  represent: representYamlFloat,
  defaultStyle: 'lowercase'
});


/***/ }),

/***/ 4652:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



var common = __nccwpck_require__(9816);
var Type   = __nccwpck_require__(9557);

function isHexCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) ||
         ((0x41/* A */ <= c) && (c <= 0x46/* F */)) ||
         ((0x61/* a */ <= c) && (c <= 0x66/* f */));
}

function isOctCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x37/* 7 */));
}

function isDecCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */));
}

function resolveYamlInteger(data) {
  if (data === null) return false;

  var max = data.length,
      index = 0,
      hasDigits = false,
      ch;

  if (!max) return false;

  ch = data[index];

  // sign
  if (ch === '-' || ch === '+') {
    ch = data[++index];
  }

  if (ch === '0') {
    // 0
    if (index + 1 === max) return true;
    ch = data[++index];

    // base 2, base 8, base 16

    if (ch === 'b') {
      // base 2
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (ch !== '0' && ch !== '1') return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }


    if (ch === 'x') {
      // base 16
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (!isHexCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }


    if (ch === 'o') {
      // base 8
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (!isOctCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }
  }

  // base 10 (except 0)

  // value should not start with `_`;
  if (ch === '_') return false;

  for (; index < max; index++) {
    ch = data[index];
    if (ch === '_') continue;
    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }
    hasDigits = true;
  }

  // Should have digits and should not end with `_`
  if (!hasDigits || ch === '_') return false;

  return true;
}

function constructYamlInteger(data) {
  var value = data, sign = 1, ch;

  if (value.indexOf('_') !== -1) {
    value = value.replace(/_/g, '');
  }

  ch = value[0];

  if (ch === '-' || ch === '+') {
    if (ch === '-') sign = -1;
    value = value.slice(1);
    ch = value[0];
  }

  if (value === '0') return 0;

  if (ch === '0') {
    if (value[1] === 'b') return sign * parseInt(value.slice(2), 2);
    if (value[1] === 'x') return sign * parseInt(value.slice(2), 16);
    if (value[1] === 'o') return sign * parseInt(value.slice(2), 8);
  }

  return sign * parseInt(value, 10);
}

function isInteger(object) {
  return (Object.prototype.toString.call(object)) === '[object Number]' &&
         (object % 1 === 0 && !common.isNegativeZero(object));
}

module.exports = new Type('tag:yaml.org,2002:int', {
  kind: 'scalar',
  resolve: resolveYamlInteger,
  construct: constructYamlInteger,
  predicate: isInteger,
  represent: {
    binary:      function (obj) { return obj >= 0 ? '0b' + obj.toString(2) : '-0b' + obj.toString(2).slice(1); },
    octal:       function (obj) { return obj >= 0 ? '0o'  + obj.toString(8) : '-0o'  + obj.toString(8).slice(1); },
    decimal:     function (obj) { return obj.toString(10); },
    /* eslint-disable max-len */
    hexadecimal: function (obj) { return obj >= 0 ? '0x' + obj.toString(16).toUpperCase() :  '-0x' + obj.toString(16).toUpperCase().slice(1); }
  },
  defaultStyle: 'decimal',
  styleAliases: {
    binary:      [ 2,  'bin' ],
    octal:       [ 8,  'oct' ],
    decimal:     [ 10, 'dec' ],
    hexadecimal: [ 16, 'hex' ]
  }
});


/***/ }),

/***/ 7316:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



var Type = __nccwpck_require__(9557);

module.exports = new Type('tag:yaml.org,2002:map', {
  kind: 'mapping',
  construct: function (data) { return data !== null ? data : {}; }
});


/***/ }),

/***/ 6854:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



var Type = __nccwpck_require__(9557);

function resolveYamlMerge(data) {
  return data === '<<' || data === null;
}

module.exports = new Type('tag:yaml.org,2002:merge', {
  kind: 'scalar',
  resolve: resolveYamlMerge
});


/***/ }),

/***/ 4333:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



var Type = __nccwpck_require__(9557);

function resolveYamlNull(data) {
  if (data === null) return true;

  var max = data.length;

  return (max === 1 && data === '~') ||
         (max === 4 && (data === 'null' || data === 'Null' || data === 'NULL'));
}

function constructYamlNull() {
  return null;
}

function isNull(object) {
  return object === null;
}

module.exports = new Type('tag:yaml.org,2002:null', {
  kind: 'scalar',
  resolve: resolveYamlNull,
  construct: constructYamlNull,
  predicate: isNull,
  represent: {
    canonical: function () { return '~';    },
    lowercase: function () { return 'null'; },
    uppercase: function () { return 'NULL'; },
    camelcase: function () { return 'Null'; },
    empty:     function () { return '';     }
  },
  defaultStyle: 'lowercase'
});


/***/ }),

/***/ 8649:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



var Type = __nccwpck_require__(9557);

var _hasOwnProperty = Object.prototype.hasOwnProperty;
var _toString       = Object.prototype.toString;

function resolveYamlOmap(data) {
  if (data === null) return true;

  var objectKeys = [], index, length, pair, pairKey, pairHasKey,
      object = data;

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;

    if (_toString.call(pair) !== '[object Object]') return false;

    for (pairKey in pair) {
      if (_hasOwnProperty.call(pair, pairKey)) {
        if (!pairHasKey) pairHasKey = true;
        else return false;
      }
    }

    if (!pairHasKey) return false;

    if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
    else return false;
  }

  return true;
}

function constructYamlOmap(data) {
  return data !== null ? data : [];
}

module.exports = new Type('tag:yaml.org,2002:omap', {
  kind: 'sequence',
  resolve: resolveYamlOmap,
  construct: constructYamlOmap
});


/***/ }),

/***/ 6267:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



var Type = __nccwpck_require__(9557);

var _toString = Object.prototype.toString;

function resolveYamlPairs(data) {
  if (data === null) return true;

  var index, length, pair, keys, result,
      object = data;

  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];

    if (_toString.call(pair) !== '[object Object]') return false;

    keys = Object.keys(pair);

    if (keys.length !== 1) return false;

    result[index] = [ keys[0], pair[keys[0]] ];
  }

  return true;
}

function constructYamlPairs(data) {
  if (data === null) return [];

  var index, length, pair, keys, result,
      object = data;

  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];

    keys = Object.keys(pair);

    result[index] = [ keys[0], pair[keys[0]] ];
  }

  return result;
}

module.exports = new Type('tag:yaml.org,2002:pairs', {
  kind: 'sequence',
  resolve: resolveYamlPairs,
  construct: constructYamlPairs
});


/***/ }),

/***/ 7161:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



var Type = __nccwpck_require__(9557);

module.exports = new Type('tag:yaml.org,2002:seq', {
  kind: 'sequence',
  construct: function (data) { return data !== null ? data : []; }
});


/***/ }),

/***/ 8758:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



var Type = __nccwpck_require__(9557);

var _hasOwnProperty = Object.prototype.hasOwnProperty;

function resolveYamlSet(data) {
  if (data === null) return true;

  var key, object = data;

  for (key in object) {
    if (_hasOwnProperty.call(object, key)) {
      if (object[key] !== null) return false;
    }
  }

  return true;
}

function constructYamlSet(data) {
  return data !== null ? data : {};
}

module.exports = new Type('tag:yaml.org,2002:set', {
  kind: 'mapping',
  resolve: resolveYamlSet,
  construct: constructYamlSet
});


/***/ }),

/***/ 3929:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



var Type = __nccwpck_require__(9557);

module.exports = new Type('tag:yaml.org,2002:str', {
  kind: 'scalar',
  construct: function (data) { return data !== null ? data : ''; }
});


/***/ }),

/***/ 8966:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



var Type = __nccwpck_require__(9557);

var YAML_DATE_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'          + // [1] year
  '-([0-9][0-9])'                    + // [2] month
  '-([0-9][0-9])$');                   // [3] day

var YAML_TIMESTAMP_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'          + // [1] year
  '-([0-9][0-9]?)'                   + // [2] month
  '-([0-9][0-9]?)'                   + // [3] day
  '(?:[Tt]|[ \\t]+)'                 + // ...
  '([0-9][0-9]?)'                    + // [4] hour
  ':([0-9][0-9])'                    + // [5] minute
  ':([0-9][0-9])'                    + // [6] second
  '(?:\\.([0-9]*))?'                 + // [7] fraction
  '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' + // [8] tz [9] tz_sign [10] tz_hour
  '(?::([0-9][0-9]))?))?$');           // [11] tz_minute

function resolveYamlTimestamp(data) {
  if (data === null) return false;
  if (YAML_DATE_REGEXP.exec(data) !== null) return true;
  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
  return false;
}

function constructYamlTimestamp(data) {
  var match, year, month, day, hour, minute, second, fraction = 0,
      delta = null, tz_hour, tz_minute, date;

  match = YAML_DATE_REGEXP.exec(data);
  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);

  if (match === null) throw new Error('Date resolve error');

  // match: [1] year [2] month [3] day

  year = +(match[1]);
  month = +(match[2]) - 1; // JS month starts with 0
  day = +(match[3]);

  if (!match[4]) { // no hour
    return new Date(Date.UTC(year, month, day));
  }

  // match: [4] hour [5] minute [6] second [7] fraction

  hour = +(match[4]);
  minute = +(match[5]);
  second = +(match[6]);

  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) { // milli-seconds
      fraction += '0';
    }
    fraction = +fraction;
  }

  // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute

  if (match[9]) {
    tz_hour = +(match[10]);
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds
    if (match[9] === '-') delta = -delta;
  }

  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));

  if (delta) date.setTime(date.getTime() - delta);

  return date;
}

function representYamlTimestamp(object /*, style*/) {
  return object.toISOString();
}

module.exports = new Type('tag:yaml.org,2002:timestamp', {
  kind: 'scalar',
  resolve: resolveYamlTimestamp,
  construct: constructYamlTimestamp,
  instanceOf: Date,
  represent: representYamlTimestamp
});


/***/ }),

/***/ 1167:
/***/ ((module) => {



var traverse = module.exports = function (schema, opts, cb) {
  // Legacy support for v0.3.1 and earlier.
  if (typeof opts == 'function') {
    cb = opts;
    opts = {};
  }

  cb = opts.cb || cb;
  var pre = (typeof cb == 'function') ? cb : cb.pre || function() {};
  var post = cb.post || function() {};

  _traverse(opts, pre, post, schema, '', schema);
};


traverse.keywords = {
  additionalItems: true,
  items: true,
  contains: true,
  additionalProperties: true,
  propertyNames: true,
  not: true,
  if: true,
  then: true,
  else: true
};

traverse.arrayKeywords = {
  items: true,
  allOf: true,
  anyOf: true,
  oneOf: true
};

traverse.propsKeywords = {
  $defs: true,
  definitions: true,
  properties: true,
  patternProperties: true,
  dependencies: true
};

traverse.skipKeywords = {
  default: true,
  enum: true,
  const: true,
  required: true,
  maximum: true,
  minimum: true,
  exclusiveMaximum: true,
  exclusiveMinimum: true,
  multipleOf: true,
  maxLength: true,
  minLength: true,
  pattern: true,
  format: true,
  maxItems: true,
  minItems: true,
  uniqueItems: true,
  maxProperties: true,
  minProperties: true
};


function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
  if (schema && typeof schema == 'object' && !Array.isArray(schema)) {
    pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
    for (var key in schema) {
      var sch = schema[key];
      if (Array.isArray(sch)) {
        if (key in traverse.arrayKeywords) {
          for (var i=0; i<sch.length; i++)
            _traverse(opts, pre, post, sch[i], jsonPtr + '/' + key + '/' + i, rootSchema, jsonPtr, key, schema, i);
        }
      } else if (key in traverse.propsKeywords) {
        if (sch && typeof sch == 'object') {
          for (var prop in sch)
            _traverse(opts, pre, post, sch[prop], jsonPtr + '/' + key + '/' + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
        }
      } else if (key in traverse.keywords || (opts.allKeys && !(key in traverse.skipKeywords))) {
        _traverse(opts, pre, post, sch, jsonPtr + '/' + key, rootSchema, jsonPtr, key, schema);
      }
    }
    post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
  }
}


function escapeJsonPtr(str) {
  return str.replace(/~/g, '~0').replace(/\//g, '~1');
}


/***/ }),

/***/ 3976:
/***/ ((__unused_webpack_module, exports) => {

var hasExcape = /~/
var escapeMatcher = /~[01]/g
function escapeReplacer (m) {
  switch (m) {
    case '~1': return '/'
    case '~0': return '~'
  }
  throw new Error('Invalid tilde escape: ' + m)
}

function untilde (str) {
  if (!hasExcape.test(str)) return str
  return str.replace(escapeMatcher, escapeReplacer)
}

function setter (obj, pointer, value) {
  var part
  var hasNextPart

  for (var p = 1, len = pointer.length; p < len;) {
    if (pointer[p] === 'constructor' || pointer[p] === 'prototype' || pointer[p] === '__proto__') return obj

    part = untilde(pointer[p++])
    hasNextPart = len > p

    if (typeof obj[part] === 'undefined') {
      // support setting of /-
      if (Array.isArray(obj) && part === '-') {
        part = obj.length
      }

      // support nested objects/array when setting values
      if (hasNextPart) {
        if ((pointer[p] !== '' && pointer[p] < Infinity) || pointer[p] === '-') obj[part] = []
        else obj[part] = {}
      }
    }

    if (!hasNextPart) break
    obj = obj[part]
  }

  var oldValue = obj[part]
  if (value === undefined) delete obj[part]
  else obj[part] = value
  return oldValue
}

function compilePointer (pointer) {
  if (typeof pointer === 'string') {
    pointer = pointer.split('/')
    if (pointer[0] === '') return pointer
    throw new Error('Invalid JSON pointer.')
  } else if (Array.isArray(pointer)) {
    for (const part of pointer) {
      if (typeof part !== 'string' && typeof part !== 'number') {
        throw new Error('Invalid JSON pointer. Must be of type string or number.')
      }
    }
    return pointer
  }

  throw new Error('Invalid JSON pointer.')
}

function get (obj, pointer) {
  if (typeof obj !== 'object') throw new Error('Invalid input object.')
  pointer = compilePointer(pointer)
  var len = pointer.length
  if (len === 1) return obj

  for (var p = 1; p < len;) {
    obj = obj[untilde(pointer[p++])]
    if (len === p) return obj
    if (typeof obj !== 'object' || obj === null) return undefined
  }
}

function set (obj, pointer, value) {
  if (typeof obj !== 'object') throw new Error('Invalid input object.')
  pointer = compilePointer(pointer)
  if (pointer.length === 0) throw new Error('Invalid JSON pointer for set.')
  return setter(obj, pointer, value)
}

function compile (pointer) {
  var compiled = compilePointer(pointer)
  return {
    get: function (object) {
      return get(object, compiled)
    },
    set: function (object, value) {
      return set(object, compiled, value)
    }
  }
}

exports.get = get
exports.set = set
exports.compile = compile


/***/ }),

/***/ 1444:
/***/ ((module) => {


const array = [];
const charCodeCache = [];

const leven = (left, right) => {
	if (left === right) {
		return 0;
	}

	const swap = left;

	// Swapping the strings if `a` is longer than `b` so we know which one is the
	// shortest & which one is the longest
	if (left.length > right.length) {
		left = right;
		right = swap;
	}

	let leftLength = left.length;
	let rightLength = right.length;

	// Performing suffix trimming:
	// We can linearly drop suffix common to both strings since they
	// don't increase distance at all
	// Note: `~-` is the bitwise way to perform a `- 1` operation
	while (leftLength > 0 && (left.charCodeAt(~-leftLength) === right.charCodeAt(~-rightLength))) {
		leftLength--;
		rightLength--;
	}

	// Performing prefix trimming
	// We can linearly drop prefix common to both strings since they
	// don't increase distance at all
	let start = 0;

	while (start < leftLength && (left.charCodeAt(start) === right.charCodeAt(start))) {
		start++;
	}

	leftLength -= start;
	rightLength -= start;

	if (leftLength === 0) {
		return rightLength;
	}

	let bCharCode;
	let result;
	let temp;
	let temp2;
	let i = 0;
	let j = 0;

	while (i < leftLength) {
		charCodeCache[i] = left.charCodeAt(start + i);
		array[i] = ++i;
	}

	while (j < rightLength) {
		bCharCode = right.charCodeAt(start + j);
		temp = j++;
		result = j;

		for (i = 0; i < leftLength; i++) {
			temp2 = bCharCode === charCodeCache[i] ? temp : temp + 1;
			temp = array[i];
			// eslint-disable-next-line no-multi-assign
			result = array[i] = temp > result ? temp2 > result ? result + 1 : temp2 : temp2 > temp ? temp + 1 : temp2;
		}
	}

	return result;
};

module.exports = leven;
// TODO: Remove this for the next major release
module.exports["default"] = leven;


/***/ }),

/***/ 4955:
/***/ ((module) => {

let p = process || {}, argv = p.argv || [], env = p.env || {}
let isColorSupported =
	!(!!env.NO_COLOR || argv.includes("--no-color")) &&
	(!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || ((p.stdout || {}).isTTY && env.TERM !== "dumb") || !!env.CI)

let formatter = (open, close, replace = open) =>
	input => {
		let string = "" + input, index = string.indexOf(close, open.length)
		return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close
	}

let replaceClose = (string, close, replace, index) => {
	let result = "", cursor = 0
	do {
		result += string.substring(cursor, index) + replace
		cursor = index + close.length
		index = string.indexOf(close, cursor)
	} while (~index)
	return result + string.substring(cursor)
}

let createColors = (enabled = isColorSupported) => {
	let f = enabled ? formatter : () => String
	return {
		isColorSupported: enabled,
		reset: f("\x1b[0m", "\x1b[0m"),
		bold: f("\x1b[1m", "\x1b[22m", "\x1b[22m\x1b[1m"),
		dim: f("\x1b[2m", "\x1b[22m", "\x1b[22m\x1b[2m"),
		italic: f("\x1b[3m", "\x1b[23m"),
		underline: f("\x1b[4m", "\x1b[24m"),
		inverse: f("\x1b[7m", "\x1b[27m"),
		hidden: f("\x1b[8m", "\x1b[28m"),
		strikethrough: f("\x1b[9m", "\x1b[29m"),

		black: f("\x1b[30m", "\x1b[39m"),
		red: f("\x1b[31m", "\x1b[39m"),
		green: f("\x1b[32m", "\x1b[39m"),
		yellow: f("\x1b[33m", "\x1b[39m"),
		blue: f("\x1b[34m", "\x1b[39m"),
		magenta: f("\x1b[35m", "\x1b[39m"),
		cyan: f("\x1b[36m", "\x1b[39m"),
		white: f("\x1b[37m", "\x1b[39m"),
		gray: f("\x1b[90m", "\x1b[39m"),

		bgBlack: f("\x1b[40m", "\x1b[49m"),
		bgRed: f("\x1b[41m", "\x1b[49m"),
		bgGreen: f("\x1b[42m", "\x1b[49m"),
		bgYellow: f("\x1b[43m", "\x1b[49m"),
		bgBlue: f("\x1b[44m", "\x1b[49m"),
		bgMagenta: f("\x1b[45m", "\x1b[49m"),
		bgCyan: f("\x1b[46m", "\x1b[49m"),
		bgWhite: f("\x1b[47m", "\x1b[49m"),

		blackBright: f("\x1b[90m", "\x1b[39m"),
		redBright: f("\x1b[91m", "\x1b[39m"),
		greenBright: f("\x1b[92m", "\x1b[39m"),
		yellowBright: f("\x1b[93m", "\x1b[39m"),
		blueBright: f("\x1b[94m", "\x1b[39m"),
		magentaBright: f("\x1b[95m", "\x1b[39m"),
		cyanBright: f("\x1b[96m", "\x1b[39m"),
		whiteBright: f("\x1b[97m", "\x1b[39m"),

		bgBlackBright: f("\x1b[100m", "\x1b[49m"),
		bgRedBright: f("\x1b[101m", "\x1b[49m"),
		bgGreenBright: f("\x1b[102m", "\x1b[49m"),
		bgYellowBright: f("\x1b[103m", "\x1b[49m"),
		bgBlueBright: f("\x1b[104m", "\x1b[49m"),
		bgMagentaBright: f("\x1b[105m", "\x1b[49m"),
		bgCyanBright: f("\x1b[106m", "\x1b[49m"),
		bgWhiteBright: f("\x1b[107m", "\x1b[49m"),
	}
}

module.exports = createColors()
module.exports.createColors = createColors


/***/ }),

/***/ 9896:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("fs");

/***/ }),

/***/ 1455:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:fs/promises");

/***/ }),

/***/ 6928:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("path");

/***/ }),

/***/ 147:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {



Object.defineProperty(exports, "__esModule", ({ value: true }));

var picocolors = __nccwpck_require__(4955);
var jsTokens = __nccwpck_require__(5756);
var helperValidatorIdentifier = __nccwpck_require__(6599);

function isColorSupported() {
  return (typeof process === "object" && (process.env.FORCE_COLOR === "0" || process.env.FORCE_COLOR === "false") ? false : picocolors.isColorSupported
  );
}
const compose = (f, g) => v => f(g(v));
function buildDefs(colors) {
  return {
    keyword: colors.cyan,
    capitalized: colors.yellow,
    jsxIdentifier: colors.yellow,
    punctuator: colors.yellow,
    number: colors.magenta,
    string: colors.green,
    regex: colors.magenta,
    comment: colors.gray,
    invalid: compose(compose(colors.white, colors.bgRed), colors.bold),
    gutter: colors.gray,
    marker: compose(colors.red, colors.bold),
    message: compose(colors.red, colors.bold),
    reset: colors.reset
  };
}
const defsOn = buildDefs(picocolors.createColors(true));
const defsOff = buildDefs(picocolors.createColors(false));
function getDefs(enabled) {
  return enabled ? defsOn : defsOff;
}

const sometimesKeywords = new Set(["as", "async", "from", "get", "of", "set"]);
const NEWLINE$1 = /\r\n|[\n\r\u2028\u2029]/;
const BRACKET = /^[()[\]{}]$/;
let tokenize;
const JSX_TAG = /^[a-z][\w-]*$/i;
const getTokenType = function (token, offset, text) {
  if (token.type === "name") {
    const tokenValue = token.value;
    if (helperValidatorIdentifier.isKeyword(tokenValue) || helperValidatorIdentifier.isStrictReservedWord(tokenValue, true) || sometimesKeywords.has(tokenValue)) {
      return "keyword";
    }
    if (JSX_TAG.test(tokenValue) && (text[offset - 1] === "<" || text.slice(offset - 2, offset) === "</")) {
      return "jsxIdentifier";
    }
    const firstChar = String.fromCodePoint(tokenValue.codePointAt(0));
    if (firstChar !== firstChar.toLowerCase()) {
      return "capitalized";
    }
  }
  if (token.type === "punctuator" && BRACKET.test(token.value)) {
    return "bracket";
  }
  if (token.type === "invalid" && (token.value === "@" || token.value === "#")) {
    return "punctuator";
  }
  return token.type;
};
tokenize = function* (text) {
  let match;
  while (match = jsTokens.default.exec(text)) {
    const token = jsTokens.matchToToken(match);
    yield {
      type: getTokenType(token, match.index, text),
      value: token.value
    };
  }
};
function highlight(text) {
  if (text === "") return "";
  const defs = getDefs(true);
  let highlighted = "";
  for (const {
    type,
    value
  } of tokenize(text)) {
    if (type in defs) {
      highlighted += value.split(NEWLINE$1).map(str => defs[type](str)).join("\n");
    } else {
      highlighted += value;
    }
  }
  return highlighted;
}

let deprecationWarningShown = false;
const NEWLINE = /\r\n|[\n\r\u2028\u2029]/;
function getMarkerLines(loc, source, opts, startLineBaseZero) {
  const startLoc = Object.assign({
    column: 0,
    line: -1
  }, loc.start);
  const endLoc = Object.assign({}, startLoc, loc.end);
  const {
    linesAbove = 2,
    linesBelow = 3
  } = opts || {};
  const startLine = startLoc.line - startLineBaseZero;
  const startColumn = startLoc.column;
  const endLine = endLoc.line - startLineBaseZero;
  const endColumn = endLoc.column;
  let start = Math.max(startLine - (linesAbove + 1), 0);
  let end = Math.min(source.length, endLine + linesBelow);
  if (startLine === -1) {
    start = 0;
  }
  if (endLine === -1) {
    end = source.length;
  }
  const lineDiff = endLine - startLine;
  const markerLines = {};
  if (lineDiff) {
    for (let i = 0; i <= lineDiff; i++) {
      const lineNumber = i + startLine;
      if (!startColumn) {
        markerLines[lineNumber] = true;
      } else if (i === 0) {
        const sourceLength = source[lineNumber - 1].length;
        markerLines[lineNumber] = [startColumn, sourceLength - startColumn + 1];
      } else if (i === lineDiff) {
        markerLines[lineNumber] = [0, endColumn];
      } else {
        const sourceLength = source[lineNumber - i].length;
        markerLines[lineNumber] = [0, sourceLength];
      }
    }
  } else {
    if (startColumn === endColumn) {
      if (startColumn) {
        markerLines[startLine] = [startColumn, 0];
      } else {
        markerLines[startLine] = true;
      }
    } else {
      markerLines[startLine] = [startColumn, endColumn - startColumn];
    }
  }
  return {
    start,
    end,
    markerLines
  };
}
function codeFrameColumns(rawLines, loc, opts = {}) {
  const shouldHighlight = opts.forceColor || isColorSupported() && opts.highlightCode;
  const startLineBaseZero = (opts.startLine || 1) - 1;
  const defs = getDefs(shouldHighlight);
  const lines = rawLines.split(NEWLINE);
  const {
    start,
    end,
    markerLines
  } = getMarkerLines(loc, lines, opts, startLineBaseZero);
  const hasColumns = loc.start && typeof loc.start.column === "number";
  const numberMaxWidth = String(end + startLineBaseZero).length;
  const highlightedLines = shouldHighlight ? highlight(rawLines) : rawLines;
  let frame = highlightedLines.split(NEWLINE, end).slice(start, end).map((line, index) => {
    const number = start + 1 + index;
    const paddedNumber = ` ${number + startLineBaseZero}`.slice(-numberMaxWidth);
    const gutter = ` ${paddedNumber} |`;
    const hasMarker = markerLines[number];
    const lastMarkerLine = !markerLines[number + 1];
    if (hasMarker) {
      let markerLine = "";
      if (Array.isArray(hasMarker)) {
        const markerSpacing = line.slice(0, Math.max(hasMarker[0] - 1, 0)).replace(/[^\t]/g, " ");
        const numberOfMarkers = hasMarker[1] || 1;
        markerLine = ["\n ", defs.gutter(gutter.replace(/\d/g, " ")), " ", markerSpacing, defs.marker("^").repeat(numberOfMarkers)].join("");
        if (lastMarkerLine && opts.message) {
          markerLine += " " + defs.message(opts.message);
        }
      }
      return [defs.marker(">"), defs.gutter(gutter), line.length > 0 ? ` ${line}` : "", markerLine].join("");
    } else {
      return ` ${defs.gutter(gutter)}${line.length > 0 ? ` ${line}` : ""}`;
    }
  }).join("\n");
  if (opts.message && !hasColumns) {
    frame = `${" ".repeat(numberMaxWidth + 1)}${opts.message}\n${frame}`;
  }
  if (shouldHighlight) {
    return defs.reset(frame);
  } else {
    return frame;
  }
}
function index (rawLines, lineNumber, colNumber, opts = {}) {
  if (!deprecationWarningShown) {
    deprecationWarningShown = true;
    const message = "Passing lineNumber and colNumber is deprecated to @babel/code-frame. Please use `codeFrameColumns`.";
    if (process.emitWarning) {
      process.emitWarning(message, "DeprecationWarning");
    } else {
      const deprecationError = new Error(message);
      deprecationError.name = "DeprecationWarning";
      console.warn(new Error(message));
    }
  }
  colNumber = Math.max(colNumber, 0);
  const location = {
    start: {
      column: colNumber,
      line: lineNumber
    }
  };
  return codeFrameColumns(rawLines, location, opts);
}

exports.codeFrameColumns = codeFrameColumns;
exports["default"] = index;
exports.highlight = highlight;
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 2924:
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.isIdentifierChar = isIdentifierChar;
exports.isIdentifierName = isIdentifierName;
exports.isIdentifierStart = isIdentifierStart;
let nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u0870-\u0887\u0889-\u088f\u08a0-\u08c9\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u09fc\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c5c\u0c5d\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cdc-\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d04-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e86-\u0e8a\u0e8c-\u0ea3\u0ea5\u0ea7-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u1711\u171f-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4c\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c8a\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf3\u1cf5\u1cf6\u1cfa\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31bf\u31f0-\u31ff\u3400-\u4dbf\u4e00-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7dc\ua7f1-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab69\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
let nonASCIIidentifierChars = "\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u07fd\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u0897-\u089f\u08ca-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u09fe\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0afa-\u0aff\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b55-\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c04\u0c3c\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0cf3\u0d00-\u0d03\u0d3b\u0d3c\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d81-\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0ebc\u0ec8-\u0ece\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1715\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u180f-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1abf-\u1add\u1ae0-\u1aeb\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf4\u1cf7-\u1cf9\u1dc0-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\u30fb\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua82c\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua8ff-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f\uff65";
const nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
const nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;
const astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 14, 29, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51, 13, 10, 2, 14, 2, 6, 2, 1, 2, 10, 2, 14, 2, 6, 2, 1, 4, 51, 13, 310, 10, 21, 11, 7, 25, 5, 2, 41, 2, 8, 70, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25, 7, 25, 39, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 28, 43, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 56, 50, 14, 50, 14, 35, 39, 27, 10, 22, 251, 41, 7, 1, 17, 5, 57, 28, 11, 0, 9, 21, 43, 17, 47, 20, 28, 22, 13, 52, 58, 1, 3, 0, 14, 44, 33, 24, 27, 35, 30, 0, 3, 0, 9, 34, 4, 0, 13, 47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 20, 1, 64, 6, 2, 0, 2, 3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 19, 0, 13, 4, 31, 9, 2, 0, 3, 0, 2, 37, 2, 0, 26, 0, 2, 0, 45, 52, 19, 3, 21, 2, 31, 47, 21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 14, 0, 72, 26, 38, 6, 186, 43, 117, 63, 32, 7, 3, 0, 3, 7, 2, 1, 2, 23, 16, 0, 2, 0, 95, 7, 3, 38, 17, 0, 2, 0, 29, 0, 11, 39, 8, 0, 22, 0, 12, 45, 20, 0, 19, 72, 200, 32, 32, 8, 2, 36, 18, 0, 50, 29, 113, 6, 2, 1, 2, 37, 22, 0, 26, 5, 2, 1, 2, 31, 15, 0, 24, 43, 261, 18, 16, 0, 2, 12, 2, 33, 125, 0, 80, 921, 103, 110, 18, 195, 2637, 96, 16, 1071, 18, 5, 26, 3994, 6, 582, 6842, 29, 1763, 568, 8, 30, 18, 78, 18, 29, 19, 47, 17, 3, 32, 20, 6, 18, 433, 44, 212, 63, 33, 24, 3, 24, 45, 74, 6, 0, 67, 12, 65, 1, 2, 0, 15, 4, 10, 7381, 42, 31, 98, 114, 8702, 3, 2, 6, 2, 1, 2, 290, 16, 0, 30, 2, 3, 0, 15, 3, 9, 395, 2309, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 1845, 30, 7, 5, 262, 61, 147, 44, 11, 6, 17, 0, 322, 29, 19, 43, 485, 27, 229, 29, 3, 0, 208, 30, 2, 2, 2, 1, 2, 6, 3, 4, 10, 1, 225, 6, 2, 3, 2, 1, 2, 14, 2, 196, 60, 67, 8, 0, 1205, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42719, 33, 4381, 3, 5773, 3, 7472, 16, 621, 2467, 541, 1507, 4938, 6, 8489];
const astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 574, 3, 9, 9, 7, 9, 32, 4, 318, 1, 78, 5, 71, 10, 50, 3, 123, 2, 54, 14, 32, 10, 3, 1, 11, 3, 46, 10, 8, 0, 46, 9, 7, 2, 37, 13, 2, 9, 6, 1, 45, 0, 13, 2, 49, 13, 9, 3, 2, 11, 83, 11, 7, 0, 3, 0, 158, 11, 6, 9, 7, 3, 56, 1, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 68, 8, 2, 0, 3, 0, 2, 3, 2, 4, 2, 0, 15, 1, 83, 17, 10, 9, 5, 0, 82, 19, 13, 9, 214, 6, 3, 8, 28, 1, 83, 16, 16, 9, 82, 12, 9, 9, 7, 19, 58, 14, 5, 9, 243, 14, 166, 9, 71, 5, 2, 1, 3, 3, 2, 0, 2, 1, 13, 9, 120, 6, 3, 6, 4, 0, 29, 9, 41, 6, 2, 3, 9, 0, 10, 10, 47, 15, 199, 7, 137, 9, 54, 7, 2, 7, 17, 9, 57, 21, 2, 13, 123, 5, 4, 0, 2, 1, 2, 6, 2, 0, 9, 9, 49, 4, 2, 1, 2, 4, 9, 9, 55, 9, 266, 3, 10, 1, 2, 0, 49, 6, 4, 4, 14, 10, 5350, 0, 7, 14, 11465, 27, 2343, 9, 87, 9, 39, 4, 60, 6, 26, 9, 535, 9, 470, 0, 2, 54, 8, 3, 82, 0, 12, 1, 19628, 1, 4178, 9, 519, 45, 3, 22, 543, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2, 14, 1361, 6, 2, 16, 3, 6, 2, 1, 2, 4, 101, 0, 161, 6, 10, 9, 357, 0, 62, 13, 499, 13, 245, 1, 2, 9, 233, 0, 3, 0, 8, 1, 6, 0, 475, 6, 110, 6, 6, 9, 4759, 9, 787719, 239];
function isInAstralSet(code, set) {
  let pos = 0x10000;
  for (let i = 0, length = set.length; i < length; i += 2) {
    pos += set[i];
    if (pos > code) return false;
    pos += set[i + 1];
    if (pos >= code) return true;
  }
  return false;
}
function isIdentifierStart(code) {
  if (code < 65) return code === 36;
  if (code <= 90) return true;
  if (code < 97) return code === 95;
  if (code <= 122) return true;
  if (code <= 0xffff) {
    return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
  }
  return isInAstralSet(code, astralIdentifierStartCodes);
}
function isIdentifierChar(code) {
  if (code < 48) return code === 36;
  if (code < 58) return true;
  if (code < 65) return false;
  if (code <= 90) return true;
  if (code < 97) return code === 95;
  if (code <= 122) return true;
  if (code <= 0xffff) {
    return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
  }
  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
}
function isIdentifierName(name) {
  let isFirst = true;
  for (let i = 0; i < name.length; i++) {
    let cp = name.charCodeAt(i);
    if ((cp & 0xfc00) === 0xd800 && i + 1 < name.length) {
      const trail = name.charCodeAt(++i);
      if ((trail & 0xfc00) === 0xdc00) {
        cp = 0x10000 + ((cp & 0x3ff) << 10) + (trail & 0x3ff);
      }
    }
    if (isFirst) {
      isFirst = false;
      if (!isIdentifierStart(cp)) {
        return false;
      }
    } else if (!isIdentifierChar(cp)) {
      return false;
    }
  }
  return !isFirst;
}

//# sourceMappingURL=identifier.js.map


/***/ }),

/***/ 6599:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
Object.defineProperty(exports, "isIdentifierChar", ({
  enumerable: true,
  get: function () {
    return _identifier.isIdentifierChar;
  }
}));
Object.defineProperty(exports, "isIdentifierName", ({
  enumerable: true,
  get: function () {
    return _identifier.isIdentifierName;
  }
}));
Object.defineProperty(exports, "isIdentifierStart", ({
  enumerable: true,
  get: function () {
    return _identifier.isIdentifierStart;
  }
}));
Object.defineProperty(exports, "isKeyword", ({
  enumerable: true,
  get: function () {
    return _keyword.isKeyword;
  }
}));
Object.defineProperty(exports, "isReservedWord", ({
  enumerable: true,
  get: function () {
    return _keyword.isReservedWord;
  }
}));
Object.defineProperty(exports, "isStrictBindOnlyReservedWord", ({
  enumerable: true,
  get: function () {
    return _keyword.isStrictBindOnlyReservedWord;
  }
}));
Object.defineProperty(exports, "isStrictBindReservedWord", ({
  enumerable: true,
  get: function () {
    return _keyword.isStrictBindReservedWord;
  }
}));
Object.defineProperty(exports, "isStrictReservedWord", ({
  enumerable: true,
  get: function () {
    return _keyword.isStrictReservedWord;
  }
}));
var _identifier = __nccwpck_require__(2924);
var _keyword = __nccwpck_require__(9884);

//# sourceMappingURL=index.js.map


/***/ }),

/***/ 9884:
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.isKeyword = isKeyword;
exports.isReservedWord = isReservedWord;
exports.isStrictBindOnlyReservedWord = isStrictBindOnlyReservedWord;
exports.isStrictBindReservedWord = isStrictBindReservedWord;
exports.isStrictReservedWord = isStrictReservedWord;
const reservedWords = {
  keyword: ["break", "case", "catch", "continue", "debugger", "default", "do", "else", "finally", "for", "function", "if", "return", "switch", "throw", "try", "var", "const", "while", "with", "new", "this", "super", "class", "extends", "export", "import", "null", "true", "false", "in", "instanceof", "typeof", "void", "delete"],
  strict: ["implements", "interface", "let", "package", "private", "protected", "public", "static", "yield"],
  strictBind: ["eval", "arguments"]
};
const keywords = new Set(reservedWords.keyword);
const reservedWordsStrictSet = new Set(reservedWords.strict);
const reservedWordsStrictBindSet = new Set(reservedWords.strictBind);
function isReservedWord(word, inModule) {
  return inModule && word === "await" || word === "enum";
}
function isStrictReservedWord(word, inModule) {
  return isReservedWord(word, inModule) || reservedWordsStrictSet.has(word);
}
function isStrictBindOnlyReservedWord(word) {
  return reservedWordsStrictBindSet.has(word);
}
function isStrictBindReservedWord(word, inModule) {
  return isStrictReservedWord(word, inModule) || isStrictBindOnlyReservedWord(word);
}
function isKeyword(word) {
  return keywords.has(word);
}

//# sourceMappingURL=keyword.js.map


/***/ }),

/***/ 9754:
/***/ ((module) => {

function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
module.exports = _arrayLikeToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 1474:
/***/ ((module) => {

function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
module.exports = _arrayWithHoles, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 1310:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var arrayLikeToArray = __nccwpck_require__(9754);
function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return arrayLikeToArray(r);
}
module.exports = _arrayWithoutHoles, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 5228:
/***/ ((module) => {

function _assertThisInitialized(e) {
  if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return e;
}
module.exports = _assertThisInitialized, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 7450:
/***/ ((module) => {

function _classCallCheck(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}
module.exports = _classCallCheck, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 1916:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var toPropertyKey = __nccwpck_require__(3963);
function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, toPropertyKey(o.key), o);
  }
}
function _createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
    writable: !1
  }), e;
}
module.exports = _createClass, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 5300:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var toPropertyKey = __nccwpck_require__(3963);
function _defineProperty(e, r, t) {
  return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}
module.exports = _defineProperty, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 996:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var superPropBase = __nccwpck_require__(5767);
function _get() {
  return module.exports = _get = "undefined" != typeof Reflect && Reflect.get ? Reflect.get.bind() : function (e, t, r) {
    var p = superPropBase(e, t);
    if (p) {
      var n = Object.getOwnPropertyDescriptor(p, t);
      return n.get ? n.get.call(arguments.length < 3 ? e : r) : n.value;
    }
  }, module.exports.__esModule = true, module.exports["default"] = module.exports, _get.apply(null, arguments);
}
module.exports = _get, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 153:
/***/ ((module) => {

function _getPrototypeOf(t) {
  return module.exports = _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
    return t.__proto__ || Object.getPrototypeOf(t);
  }, module.exports.__esModule = true, module.exports["default"] = module.exports, _getPrototypeOf(t);
}
module.exports = _getPrototypeOf, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 5802:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var setPrototypeOf = __nccwpck_require__(1013);
function _inherits(t, e) {
  if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
  t.prototype = Object.create(e && e.prototype, {
    constructor: {
      value: t,
      writable: !0,
      configurable: !0
    }
  }), Object.defineProperty(t, "prototype", {
    writable: !1
  }), e && setPrototypeOf(t, e);
}
module.exports = _inherits, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 2645:
/***/ ((module) => {

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    "default": e
  };
}
module.exports = _interopRequireDefault, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 6796:
/***/ ((module) => {

function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
module.exports = _iterableToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 9597:
/***/ ((module) => {

function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = !0,
      o = !1;
    try {
      if (i = (t = t.call(r)).next, 0 === l) {
        if (Object(t) !== t) return;
        f = !1;
      } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
    } catch (r) {
      o = !0, n = r;
    } finally {
      try {
        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
module.exports = _iterableToArrayLimit, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 5843:
/***/ ((module) => {

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
module.exports = _nonIterableRest, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 7366:
/***/ ((module) => {

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
module.exports = _nonIterableSpread, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 1315:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var _typeof = (__nccwpck_require__(7087)["default"]);
var assertThisInitialized = __nccwpck_require__(5228);
function _possibleConstructorReturn(t, e) {
  if (e && ("object" == _typeof(e) || "function" == typeof e)) return e;
  if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
  return assertThisInitialized(t);
}
module.exports = _possibleConstructorReturn, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 1013:
/***/ ((module) => {

function _setPrototypeOf(t, e) {
  return module.exports = _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
    return t.__proto__ = e, t;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports, _setPrototypeOf(t, e);
}
module.exports = _setPrototypeOf, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 8208:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var arrayWithHoles = __nccwpck_require__(1474);
var iterableToArrayLimit = __nccwpck_require__(9597);
var unsupportedIterableToArray = __nccwpck_require__(4643);
var nonIterableRest = __nccwpck_require__(5843);
function _slicedToArray(r, e) {
  return arrayWithHoles(r) || iterableToArrayLimit(r, e) || unsupportedIterableToArray(r, e) || nonIterableRest();
}
module.exports = _slicedToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 5767:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var getPrototypeOf = __nccwpck_require__(153);
function _superPropBase(t, o) {
  for (; !{}.hasOwnProperty.call(t, o) && null !== (t = getPrototypeOf(t)););
  return t;
}
module.exports = _superPropBase, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 1987:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var arrayWithoutHoles = __nccwpck_require__(1310);
var iterableToArray = __nccwpck_require__(6796);
var unsupportedIterableToArray = __nccwpck_require__(4643);
var nonIterableSpread = __nccwpck_require__(7366);
function _toConsumableArray(r) {
  return arrayWithoutHoles(r) || iterableToArray(r) || unsupportedIterableToArray(r) || nonIterableSpread();
}
module.exports = _toConsumableArray, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 9558:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var _typeof = (__nccwpck_require__(7087)["default"]);
function toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
module.exports = toPrimitive, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 3963:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var _typeof = (__nccwpck_require__(7087)["default"]);
var toPrimitive = __nccwpck_require__(9558);
function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
module.exports = toPropertyKey, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 7087:
/***/ ((module) => {

function _typeof(o) {
  "@babel/helpers - typeof";

  return module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports, _typeof(o);
}
module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 4643:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var arrayLikeToArray = __nccwpck_require__(9754);
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? arrayLikeToArray(r, a) : void 0;
  }
}
module.exports = _unsupportedIterableToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 4352:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



const { normalizeIPv6, removeDotSegments, recomposeAuthority, normalizePercentEncoding, normalizePathEncoding, escapePreservingEscapes, reescapeHostDelimiters, isIPv4, nonSimpleDomain } = __nccwpck_require__(5077)
const { SCHEMES, getSchemeHandler } = __nccwpck_require__(2919)

/**
 * @template {import('./types/index').URIComponent|string} T
 * @param {T} uri
 * @param {import('./types/index').Options} [options]
 * @returns {T}
 */
function normalize (uri, options) {
  if (typeof uri === 'string') {
    uri = /** @type {T} */ (normalizeString(uri, options))
  } else if (typeof uri === 'object') {
    uri = /** @type {T} */ (parse(serialize(uri, options), options))
  }
  return uri
}

/**
 * @param {string} baseURI
 * @param {string} relativeURI
 * @param {import('./types/index').Options} [options]
 * @returns {string}
 */
function resolve (baseURI, relativeURI, options) {
  const schemelessOptions = options ? Object.assign({ scheme: 'null' }, options) : { scheme: 'null' }
  const resolved = resolveComponent(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true)
  schemelessOptions.skipEscape = true
  return serialize(resolved, schemelessOptions)
}

/**
 * @param {import ('./types/index').URIComponent} base
 * @param {import ('./types/index').URIComponent} relative
 * @param {import('./types/index').Options} [options]
 * @param {boolean} [skipNormalization=false]
 * @returns {import ('./types/index').URIComponent}
 */
function resolveComponent (base, relative, options, skipNormalization) {
  /** @type {import('./types/index').URIComponent} */
  const target = {}
  if (!skipNormalization) {
    base = parse(serialize(base, options), options) // normalize base component
    relative = parse(serialize(relative, options), options) // normalize relative component
  }
  options = options || {}

  if (!options.tolerant && relative.scheme) {
    target.scheme = relative.scheme
    // target.authority = relative.authority;
    target.userinfo = relative.userinfo
    target.host = relative.host
    target.port = relative.port
    target.path = removeDotSegments(relative.path || '')
    target.query = relative.query
  } else {
    if (relative.userinfo !== undefined || relative.host !== undefined || relative.port !== undefined) {
      // target.authority = relative.authority;
      target.userinfo = relative.userinfo
      target.host = relative.host
      target.port = relative.port
      target.path = removeDotSegments(relative.path || '')
      target.query = relative.query
    } else {
      if (!relative.path) {
        target.path = base.path
        if (relative.query !== undefined) {
          target.query = relative.query
        } else {
          target.query = base.query
        }
      } else {
        if (relative.path[0] === '/') {
          target.path = removeDotSegments(relative.path)
        } else {
          if ((base.userinfo !== undefined || base.host !== undefined || base.port !== undefined) && !base.path) {
            target.path = '/' + relative.path
          } else if (!base.path) {
            target.path = relative.path
          } else {
            target.path = base.path.slice(0, base.path.lastIndexOf('/') + 1) + relative.path
          }
          target.path = removeDotSegments(target.path)
        }
        target.query = relative.query
      }
      // target.authority = base.authority;
      target.userinfo = base.userinfo
      target.host = base.host
      target.port = base.port
    }
    target.scheme = base.scheme
  }

  target.fragment = relative.fragment

  return target
}

/**
 * @param {import ('./types/index').URIComponent|string} uriA
 * @param {import ('./types/index').URIComponent|string} uriB
 * @param {import ('./types/index').Options} options
 * @returns {boolean}
 */
function equal (uriA, uriB, options) {
  const normalizedA = normalizeComparableURI(uriA, options)
  const normalizedB = normalizeComparableURI(uriB, options)

  return normalizedA !== undefined && normalizedB !== undefined && normalizedA.toLowerCase() === normalizedB.toLowerCase()
}

/**
 * @param {Readonly<import('./types/index').URIComponent>} cmpts
 * @param {import('./types/index').Options} [opts]
 * @returns {string}
 */
function serialize (cmpts, opts) {
  const component = {
    host: cmpts.host,
    scheme: cmpts.scheme,
    userinfo: cmpts.userinfo,
    port: cmpts.port,
    path: cmpts.path,
    query: cmpts.query,
    nid: cmpts.nid,
    nss: cmpts.nss,
    uuid: cmpts.uuid,
    fragment: cmpts.fragment,
    reference: cmpts.reference,
    resourceName: cmpts.resourceName,
    secure: cmpts.secure,
    error: ''
  }
  const options = Object.assign({}, opts)
  const uriTokens = []

  // find scheme handler
  const schemeHandler = getSchemeHandler(options.scheme || component.scheme)

  // perform scheme specific serialization
  if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(component, options)

  if (component.path !== undefined) {
    if (!options.skipEscape) {
      component.path = escapePreservingEscapes(component.path)

      if (component.scheme !== undefined) {
        component.path = component.path.split('%3A').join(':')
      }
    } else {
      component.path = normalizePercentEncoding(component.path)
    }
  }

  if (options.reference !== 'suffix' && component.scheme) {
    uriTokens.push(component.scheme, ':')
  }

  const authority = recomposeAuthority(component)
  if (authority !== undefined) {
    if (options.reference !== 'suffix') {
      uriTokens.push('//')
    }

    uriTokens.push(authority)

    if (component.path && component.path[0] !== '/') {
      uriTokens.push('/')
    }
  }
  if (component.path !== undefined) {
    let s = component.path

    if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
      s = removeDotSegments(s)
    }

    if (
      authority === undefined &&
      s[0] === '/' &&
      s[1] === '/'
    ) {
      // don't allow the path to start with "//"
      s = '/%2F' + s.slice(2)
    }

    uriTokens.push(s)
  }

  if (component.query !== undefined) {
    uriTokens.push('?', component.query)
  }

  if (component.fragment !== undefined) {
    uriTokens.push('#', component.fragment)
  }
  return uriTokens.join('')
}

const URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u

/**
 * @param {import('./types/index').URIComponent} parsed
 * @param {RegExpMatchArray} matches
 * @returns {string|undefined}
 */
function getParseError (parsed, matches) {
  if (matches[2] !== undefined && parsed.path && parsed.path[0] !== '/') {
    return 'URI path must start with "/" when authority is present.'
  }

  if (typeof parsed.port === 'number' && (parsed.port < 0 || parsed.port > 65535)) {
    return 'URI port is malformed.'
  }

  return undefined
}

/**
 * @param {string} uri
 * @param {import('./types/index').Options} [opts]
 * @returns {{ parsed: import('./types/index').URIComponent, malformedAuthorityOrPort: boolean }}
 */
function parseWithStatus (uri, opts) {
  const options = Object.assign({}, opts)
  /** @type {import('./types/index').URIComponent} */
  const parsed = {
    scheme: undefined,
    userinfo: undefined,
    host: '',
    port: undefined,
    path: '',
    query: undefined,
    fragment: undefined
  }

  let malformedAuthorityOrPort = false

  let isIP = false
  if (options.reference === 'suffix') {
    if (options.scheme) {
      uri = options.scheme + ':' + uri
    } else {
      uri = '//' + uri
    }
  }

  const matches = uri.match(URI_PARSE)

  if (matches) {
    // store each component
    parsed.scheme = matches[1]
    parsed.userinfo = matches[3]
    parsed.host = matches[4]
    parsed.port = parseInt(matches[5], 10)
    parsed.path = matches[6] || ''
    parsed.query = matches[7]
    parsed.fragment = matches[8]

    // fix port number
    if (isNaN(parsed.port)) {
      parsed.port = matches[5]
    }

    const parseError = getParseError(parsed, matches)
    if (parseError !== undefined) {
      parsed.error = parsed.error || parseError
      malformedAuthorityOrPort = true
    }

    if (parsed.host) {
      const ipv4result = isIPv4(parsed.host)
      if (ipv4result === false) {
        const ipv6result = normalizeIPv6(parsed.host)
        parsed.host = ipv6result.host.toLowerCase()
        isIP = ipv6result.isIPV6
      } else {
        isIP = true
      }
    }
    if (parsed.scheme === undefined && parsed.userinfo === undefined && parsed.host === undefined && parsed.port === undefined && parsed.query === undefined && !parsed.path) {
      parsed.reference = 'same-document'
    } else if (parsed.scheme === undefined) {
      parsed.reference = 'relative'
    } else if (parsed.fragment === undefined) {
      parsed.reference = 'absolute'
    } else {
      parsed.reference = 'uri'
    }

    // check for reference errors
    if (options.reference && options.reference !== 'suffix' && options.reference !== parsed.reference) {
      parsed.error = parsed.error || 'URI is not a ' + options.reference + ' reference.'
    }

    // find scheme handler
    const schemeHandler = getSchemeHandler(options.scheme || parsed.scheme)

    // check if scheme can't handle IRIs
    if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
      // if host component is a domain name
      if (parsed.host && (options.domainHost || (schemeHandler && schemeHandler.domainHost)) && isIP === false && nonSimpleDomain(parsed.host)) {
        // convert Unicode IDN -> ASCII IDN
        try {
          parsed.host = URL.domainToASCII(parsed.host.toLowerCase())
        } catch (e) {
          parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e
        }
      }
      // convert IRI -> URI
    }

    if (!schemeHandler || (schemeHandler && !schemeHandler.skipNormalize)) {
      if (uri.indexOf('%') !== -1) {
        if (parsed.scheme !== undefined) {
          parsed.scheme = unescape(parsed.scheme)
        }
        if (parsed.host !== undefined) {
          parsed.host = reescapeHostDelimiters(unescape(parsed.host), isIP)
        }
      }
      if (parsed.path) {
        parsed.path = normalizePathEncoding(parsed.path)
      }
      if (parsed.fragment) {
        try {
          parsed.fragment = encodeURI(decodeURIComponent(parsed.fragment))
        } catch {
          parsed.error = parsed.error || 'URI malformed'
        }
      }
    }

    // perform scheme specific parsing
    if (schemeHandler && schemeHandler.parse) {
      schemeHandler.parse(parsed, options)
    }
  } else {
    parsed.error = parsed.error || 'URI can not be parsed.'
  }
  return { parsed, malformedAuthorityOrPort }
}

/**
 * @param {string} uri
 * @param {import('./types/index').Options} [opts]
 * @returns
 */
function parse (uri, opts) {
  return parseWithStatus(uri, opts).parsed
}

/**
 * @param {string} uri
 * @param {import('./types/index').Options} [opts]
 * @returns {string}
 */
function normalizeString (uri, opts) {
  return normalizeStringWithStatus(uri, opts).normalized
}

/**
 * @param {string} uri
 * @param {import('./types/index').Options} [opts]
 * @returns {{ normalized: string, malformedAuthorityOrPort: boolean }}
 */
function normalizeStringWithStatus (uri, opts) {
  const { parsed, malformedAuthorityOrPort } = parseWithStatus(uri, opts)
  return {
    normalized: malformedAuthorityOrPort ? uri : serialize(parsed, opts),
    malformedAuthorityOrPort
  }
}

/**
 * @param {import ('./types/index').URIComponent|string} uri
 * @param {import('./types/index').Options} [opts]
 * @returns {string|undefined}
 */
function normalizeComparableURI (uri, opts) {
  if (typeof uri === 'string') {
    const { normalized, malformedAuthorityOrPort } = normalizeStringWithStatus(uri, opts)
    return malformedAuthorityOrPort ? undefined : normalized
  }

  if (typeof uri === 'object') {
    return serialize(uri, opts)
  }
}

const fastUri = {
  SCHEMES,
  normalize,
  resolve,
  resolveComponent,
  equal,
  serialize,
  parse
}

module.exports = fastUri
module.exports["default"] = fastUri
module.exports.fastUri = fastUri


/***/ }),

/***/ 2919:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



const { isUUID } = __nccwpck_require__(5077)
const URN_REG = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu

const supportedSchemeNames = /** @type {const} */ (['http', 'https', 'ws',
  'wss', 'urn', 'urn:uuid'])

/** @typedef {supportedSchemeNames[number]} SchemeName */

/**
 * @param {string} name
 * @returns {name is SchemeName}
 */
function isValidSchemeName (name) {
  return supportedSchemeNames.indexOf(/** @type {*} */ (name)) !== -1
}

/**
 * @callback SchemeFn
 * @param {import('../types/index').URIComponent} component
 * @param {import('../types/index').Options} options
 * @returns {import('../types/index').URIComponent}
 */

/**
 * @typedef {Object} SchemeHandler
 * @property {SchemeName} scheme - The scheme name.
 * @property {boolean} [domainHost] - Indicates if the scheme supports domain hosts.
 * @property {SchemeFn} parse - Function to parse the URI component for this scheme.
 * @property {SchemeFn} serialize - Function to serialize the URI component for this scheme.
 * @property {boolean} [skipNormalize] - Indicates if normalization should be skipped for this scheme.
 * @property {boolean} [absolutePath] - Indicates if the scheme uses absolute paths.
 * @property {boolean} [unicodeSupport] - Indicates if the scheme supports Unicode.
 */

/**
 * @param {import('../types/index').URIComponent} wsComponent
 * @returns {boolean}
 */
function wsIsSecure (wsComponent) {
  if (wsComponent.secure === true) {
    return true
  } else if (wsComponent.secure === false) {
    return false
  } else if (wsComponent.scheme) {
    return (
      wsComponent.scheme.length === 3 &&
      (wsComponent.scheme[0] === 'w' || wsComponent.scheme[0] === 'W') &&
      (wsComponent.scheme[1] === 's' || wsComponent.scheme[1] === 'S') &&
      (wsComponent.scheme[2] === 's' || wsComponent.scheme[2] === 'S')
    )
  } else {
    return false
  }
}

/** @type {SchemeFn} */
function httpParse (component) {
  if (!component.host) {
    component.error = component.error || 'HTTP URIs must have a host.'
  }

  return component
}

/** @type {SchemeFn} */
function httpSerialize (component) {
  const secure = String(component.scheme).toLowerCase() === 'https'

  // normalize the default port
  if (component.port === (secure ? 443 : 80) || component.port === '') {
    component.port = undefined
  }

  // normalize the empty path
  if (!component.path) {
    component.path = '/'
  }

  // NOTE: We do not parse query strings for HTTP URIs
  // as WWW Form Url Encoded query strings are part of the HTML4+ spec,
  // and not the HTTP spec.

  return component
}

/** @type {SchemeFn} */
function wsParse (wsComponent) {
// indicate if the secure flag is set
  wsComponent.secure = wsIsSecure(wsComponent)

  // construct resouce name
  wsComponent.resourceName = (wsComponent.path || '/') + (wsComponent.query ? '?' + wsComponent.query : '')
  wsComponent.path = undefined
  wsComponent.query = undefined

  return wsComponent
}

/** @type {SchemeFn} */
function wsSerialize (wsComponent) {
// normalize the default port
  if (wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === '') {
    wsComponent.port = undefined
  }

  // ensure scheme matches secure flag
  if (typeof wsComponent.secure === 'boolean') {
    wsComponent.scheme = (wsComponent.secure ? 'wss' : 'ws')
    wsComponent.secure = undefined
  }

  // reconstruct path from resource name
  if (wsComponent.resourceName) {
    const [path, query] = wsComponent.resourceName.split('?')
    wsComponent.path = (path && path !== '/' ? path : undefined)
    wsComponent.query = query
    wsComponent.resourceName = undefined
  }

  // forbid fragment component
  wsComponent.fragment = undefined

  return wsComponent
}

/** @type {SchemeFn} */
function urnParse (urnComponent, options) {
  if (!urnComponent.path) {
    urnComponent.error = 'URN can not be parsed'
    return urnComponent
  }
  const matches = urnComponent.path.match(URN_REG)
  if (matches) {
    const scheme = options.scheme || urnComponent.scheme || 'urn'
    urnComponent.nid = matches[1].toLowerCase()
    urnComponent.nss = matches[2]
    const urnScheme = `${scheme}:${options.nid || urnComponent.nid}`
    const schemeHandler = getSchemeHandler(urnScheme)
    urnComponent.path = undefined

    if (schemeHandler) {
      urnComponent = schemeHandler.parse(urnComponent, options)
    }
  } else {
    urnComponent.error = urnComponent.error || 'URN can not be parsed.'
  }

  return urnComponent
}

/** @type {SchemeFn} */
function urnSerialize (urnComponent, options) {
  if (urnComponent.nid === undefined) {
    throw new Error('URN without nid cannot be serialized')
  }
  const scheme = options.scheme || urnComponent.scheme || 'urn'
  const nid = urnComponent.nid.toLowerCase()
  const urnScheme = `${scheme}:${options.nid || nid}`
  const schemeHandler = getSchemeHandler(urnScheme)

  if (schemeHandler) {
    urnComponent = schemeHandler.serialize(urnComponent, options)
  }

  const uriComponent = urnComponent
  const nss = urnComponent.nss
  uriComponent.path = `${nid || options.nid}:${nss}`

  options.skipEscape = true
  return uriComponent
}

/** @type {SchemeFn} */
function urnuuidParse (urnComponent, options) {
  const uuidComponent = urnComponent
  uuidComponent.uuid = uuidComponent.nss
  uuidComponent.nss = undefined

  if (!options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid))) {
    uuidComponent.error = uuidComponent.error || 'UUID is not valid.'
  }

  return uuidComponent
}

/** @type {SchemeFn} */
function urnuuidSerialize (uuidComponent) {
  const urnComponent = uuidComponent
  // normalize UUID
  urnComponent.nss = (uuidComponent.uuid || '').toLowerCase()
  return urnComponent
}

const http = /** @type {SchemeHandler} */ ({
  scheme: 'http',
  domainHost: true,
  parse: httpParse,
  serialize: httpSerialize
})

const https = /** @type {SchemeHandler} */ ({
  scheme: 'https',
  domainHost: http.domainHost,
  parse: httpParse,
  serialize: httpSerialize
})

const ws = /** @type {SchemeHandler} */ ({
  scheme: 'ws',
  domainHost: true,
  parse: wsParse,
  serialize: wsSerialize
})

const wss = /** @type {SchemeHandler} */ ({
  scheme: 'wss',
  domainHost: ws.domainHost,
  parse: ws.parse,
  serialize: ws.serialize
})

const urn = /** @type {SchemeHandler} */ ({
  scheme: 'urn',
  parse: urnParse,
  serialize: urnSerialize,
  skipNormalize: true
})

const urnuuid = /** @type {SchemeHandler} */ ({
  scheme: 'urn:uuid',
  parse: urnuuidParse,
  serialize: urnuuidSerialize,
  skipNormalize: true
})

const SCHEMES = /** @type {Record<SchemeName, SchemeHandler>} */ ({
  http,
  https,
  ws,
  wss,
  urn,
  'urn:uuid': urnuuid
})

Object.setPrototypeOf(SCHEMES, null)

/**
 * @param {string|undefined} scheme
 * @returns {SchemeHandler|undefined}
 */
function getSchemeHandler (scheme) {
  return (
    scheme && (
      SCHEMES[/** @type {SchemeName} */ (scheme)] ||
      SCHEMES[/** @type {SchemeName} */(scheme.toLowerCase())])
  ) ||
    undefined
}

module.exports = {
  wsIsSecure,
  SCHEMES,
  isValidSchemeName,
  getSchemeHandler,
}


/***/ }),

/***/ 5077:
/***/ ((module) => {



/** @type {(value: string) => boolean} */
const isUUID = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu)

/** @type {(value: string) => boolean} */
const isIPv4 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u)

/** @type {(value: string) => boolean} */
const isHexPair = RegExp.prototype.test.bind(/^[\da-f]{2}$/iu)

/** @type {(value: string) => boolean} */
const isUnreserved = RegExp.prototype.test.bind(/^[\da-z\-._~]$/iu)

/** @type {(value: string) => boolean} */
const isPathCharacter = RegExp.prototype.test.bind(/^[\da-z\-._~!$&'()*+,;=:@/]$/iu)

/**
 * @param {Array<string>} input
 * @returns {string}
 */
function stringArrayToHexStripped (input) {
  let acc = ''
  let code = 0
  let i = 0

  for (i = 0; i < input.length; i++) {
    code = input[i].charCodeAt(0)
    if (code === 48) {
      continue
    }
    if (!((code >= 48 && code <= 57) || (code >= 65 && code <= 70) || (code >= 97 && code <= 102))) {
      return ''
    }
    acc += input[i]
    break
  }

  for (i += 1; i < input.length; i++) {
    code = input[i].charCodeAt(0)
    if (!((code >= 48 && code <= 57) || (code >= 65 && code <= 70) || (code >= 97 && code <= 102))) {
      return ''
    }
    acc += input[i]
  }
  return acc
}

/**
 * @typedef {Object} GetIPV6Result
 * @property {boolean} error - Indicates if there was an error parsing the IPv6 address.
 * @property {string} address - The parsed IPv6 address.
 * @property {string} [zone] - The zone identifier, if present.
 */

/**
 * @param {string} value
 * @returns {boolean}
 */
const nonSimpleDomain = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u)

/**
 * @param {Array<string>} buffer
 * @returns {boolean}
 */
function consumeIsZone (buffer) {
  buffer.length = 0
  return true
}

/**
 * @param {Array<string>} buffer
 * @param {Array<string>} address
 * @param {GetIPV6Result} output
 * @returns {boolean}
 */
function consumeHextets (buffer, address, output) {
  if (buffer.length) {
    const hex = stringArrayToHexStripped(buffer)
    if (hex !== '') {
      address.push(hex)
    } else {
      output.error = true
      return false
    }
    buffer.length = 0
  }
  return true
}

/**
 * @param {string} input
 * @returns {GetIPV6Result}
 */
function getIPV6 (input) {
  let tokenCount = 0
  const output = { error: false, address: '', zone: '' }
  /** @type {Array<string>} */
  const address = []
  /** @type {Array<string>} */
  const buffer = []
  let endipv6Encountered = false
  let endIpv6 = false

  let consume = consumeHextets

  for (let i = 0; i < input.length; i++) {
    const cursor = input[i]
    if (cursor === '[' || cursor === ']') { continue }
    if (cursor === ':') {
      if (endipv6Encountered === true) {
        endIpv6 = true
      }
      if (!consume(buffer, address, output)) { break }
      if (++tokenCount > 7) {
        // not valid
        output.error = true
        break
      }
      if (i > 0 && input[i - 1] === ':') {
        endipv6Encountered = true
      }
      address.push(':')
      continue
    } else if (cursor === '%') {
      if (!consume(buffer, address, output)) { break }
      // switch to zone detection
      consume = consumeIsZone
    } else {
      buffer.push(cursor)
      continue
    }
  }
  if (buffer.length) {
    if (consume === consumeIsZone) {
      output.zone = buffer.join('')
    } else if (endIpv6) {
      address.push(buffer.join(''))
    } else {
      address.push(stringArrayToHexStripped(buffer))
    }
  }
  output.address = address.join('')
  return output
}

/**
 * @typedef {Object} NormalizeIPv6Result
 * @property {string} host - The normalized host.
 * @property {string} [escapedHost] - The escaped host.
 * @property {boolean} isIPV6 - Indicates if the host is an IPv6 address.
 */

/**
 * @param {string} host
 * @returns {NormalizeIPv6Result}
 */
function normalizeIPv6 (host) {
  if (findToken(host, ':') < 2) { return { host, isIPV6: false } }
  const ipv6 = getIPV6(host)

  if (!ipv6.error) {
    let newHost = ipv6.address
    let escapedHost = ipv6.address
    if (ipv6.zone) {
      newHost += '%' + ipv6.zone
      escapedHost += '%25' + ipv6.zone
    }
    return { host: newHost, isIPV6: true, escapedHost }
  } else {
    return { host, isIPV6: false }
  }
}

/**
 * @param {string} str
 * @param {string} token
 * @returns {number}
 */
function findToken (str, token) {
  let ind = 0
  for (let i = 0; i < str.length; i++) {
    if (str[i] === token) ind++
  }
  return ind
}

/**
 * @param {string} path
 * @returns {string}
 *
 * @see https://datatracker.ietf.org/doc/html/rfc3986#section-5.2.4
 */
function removeDotSegments (path) {
  let input = path
  const output = []
  let nextSlash = -1
  let len = 0

  // eslint-disable-next-line no-cond-assign
  while (len = input.length) {
    if (len === 1) {
      if (input === '.') {
        break
      } else if (input === '/') {
        output.push('/')
        break
      } else {
        output.push(input)
        break
      }
    } else if (len === 2) {
      if (input[0] === '.') {
        if (input[1] === '.') {
          break
        } else if (input[1] === '/') {
          input = input.slice(2)
          continue
        }
      } else if (input[0] === '/') {
        if (input[1] === '.' || input[1] === '/') {
          output.push('/')
          break
        }
      }
    } else if (len === 3) {
      if (input === '/..') {
        if (output.length !== 0) {
          output.pop()
        }
        output.push('/')
        break
      }
    }
    if (input[0] === '.') {
      if (input[1] === '.') {
        if (input[2] === '/') {
          input = input.slice(3)
          continue
        }
      } else if (input[1] === '/') {
        input = input.slice(2)
        continue
      }
    } else if (input[0] === '/') {
      if (input[1] === '.') {
        if (input[2] === '/') {
          input = input.slice(2)
          continue
        } else if (input[2] === '.') {
          if (input[3] === '/') {
            input = input.slice(3)
            if (output.length !== 0) {
              output.pop()
            }
            continue
          }
        }
      }
    }

    // Rule 2E: Move normal path segment to output
    if ((nextSlash = input.indexOf('/', 1)) === -1) {
      output.push(input)
      break
    } else {
      output.push(input.slice(0, nextSlash))
      input = input.slice(nextSlash)
    }
  }

  return output.join('')
}

/**
 * Re-escape RFC 3986 gen-delims that must not appear literally in the host.
 * After the URI regex parses, these characters cannot be literal in the host
 * field, so any that appear after decoding came from percent-encoding and
 * must be restored to prevent authority structure changes.
 *
 * @param {string} host
 * @param {boolean} isIP - true for IPv4/IPv6 hosts (skip colon re-escaping)
 * @returns {string}
 */
const HOST_DELIMS = { '@': '%40', '/': '%2F', '?': '%3F', '#': '%23', ':': '%3A' }
const HOST_DELIM_RE = /[@/?#:]/g
const HOST_DELIM_NO_COLON_RE = /[@/?#]/g

function reescapeHostDelimiters (host, isIP) {
  const re = isIP ? HOST_DELIM_NO_COLON_RE : HOST_DELIM_RE
  re.lastIndex = 0
  return host.replace(re, (ch) => HOST_DELIMS[ch])
}

/**
 * Normalizes percent escapes and optionally decodes only unreserved ASCII bytes.
 * Reserved delimiters such as `%2F` and `%2E` stay escaped.
 *
 * @param {string} input
 * @param {boolean} [decodeUnreserved=false]
 * @returns {string}
 */
function normalizePercentEncoding (input, decodeUnreserved = false) {
  if (input.indexOf('%') === -1) {
    return input
  }

  let output = ''

  for (let i = 0; i < input.length; i++) {
    if (input[i] === '%' && i + 2 < input.length) {
      const hex = input.slice(i + 1, i + 3)
      if (isHexPair(hex)) {
        const normalizedHex = hex.toUpperCase()
        const decoded = String.fromCharCode(parseInt(normalizedHex, 16))

        if (decodeUnreserved && isUnreserved(decoded)) {
          output += decoded
        } else {
          output += '%' + normalizedHex
        }

        i += 2
        continue
      }
    }

    output += input[i]
  }

  return output
}

/**
 * Normalizes path data without turning reserved escapes into live path syntax.
 * Valid escapes are uppercased, raw unsafe characters are escaped, and only
 * unreserved bytes that are not `.` are decoded.
 *
 * @param {string} input
 * @returns {string}
 */
function normalizePathEncoding (input) {
  let output = ''

  for (let i = 0; i < input.length; i++) {
    if (input[i] === '%' && i + 2 < input.length) {
      const hex = input.slice(i + 1, i + 3)
      if (isHexPair(hex)) {
        const normalizedHex = hex.toUpperCase()
        const decoded = String.fromCharCode(parseInt(normalizedHex, 16))

        if (decoded !== '.' && isUnreserved(decoded)) {
          output += decoded
        } else {
          output += '%' + normalizedHex
        }

        i += 2
        continue
      }
    }

    if (isPathCharacter(input[i])) {
      output += input[i]
    } else {
      output += escape(input[i])
    }
  }

  return output
}

/**
 * Escapes a component while preserving existing valid percent escapes.
 *
 * @param {string} input
 * @returns {string}
 */
function escapePreservingEscapes (input) {
  let output = ''

  for (let i = 0; i < input.length; i++) {
    if (input[i] === '%' && i + 2 < input.length) {
      const hex = input.slice(i + 1, i + 3)
      if (isHexPair(hex)) {
        output += '%' + hex.toUpperCase()
        i += 2
        continue
      }
    }

    output += escape(input[i])
  }

  return output
}

/**
 * @param {import('../types/index').URIComponent} component
 * @returns {string|undefined}
 */
function recomposeAuthority (component) {
  const uriTokens = []

  if (component.userinfo !== undefined) {
    uriTokens.push(component.userinfo)
    uriTokens.push('@')
  }

  if (component.host !== undefined) {
    let host = unescape(component.host)
    if (!isIPv4(host)) {
      const ipV6res = normalizeIPv6(host)
      if (ipV6res.isIPV6 === true) {
        host = `[${ipV6res.escapedHost}]`
      } else {
        host = reescapeHostDelimiters(host, false)
      }
    }
    uriTokens.push(host)
  }

  if (typeof component.port === 'number' || typeof component.port === 'string') {
    uriTokens.push(':')
    uriTokens.push(String(component.port))
  }

  return uriTokens.length ? uriTokens.join('') : undefined
};

module.exports = {
  nonSimpleDomain,
  recomposeAuthority,
  reescapeHostDelimiters,
  normalizePercentEncoding,
  normalizePathEncoding,
  escapePreservingEscapes,
  removeDotSegments,
  isIPv4,
  isUUID,
  normalizeIPv6,
  stringArrayToHexStripped
}


/***/ }),

/***/ 6730:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nccwpck_require__) => {


// EXPORTS
__nccwpck_require__.d(__webpack_exports__, {
  tf: () => (/* binding */ validate)
});

// UNUSED EXPORTS: bundle, compileErrors, dereference, parse

;// CONCATENATED MODULE: ./node_modules/@readme/openapi-parser/dist/chunk-IYQ77VVR.js
// src/lib/assertions.ts
function isSwagger(schema) {
  return "swagger" in schema && schema.swagger !== void 0;
}
function chunk_IYQ77VVR_isOpenAPI(schema) {
  return "openapi" in schema && schema.openapi !== void 0;
}
function isOpenAPI30(schema) {
  return "openapi" in schema && schema.openapi !== void 0 && schema.openapi.startsWith("3.0");
}
function isOpenAPI31(schema) {
  return "openapi" in schema && schema.openapi !== void 0 && schema.openapi.startsWith("3.1");
}
function isOpenAPI32(schema) {
  return "openapi" in schema && schema.openapi !== void 0 && schema.openapi.startsWith("3.2");
}


//# sourceMappingURL=chunk-IYQ77VVR.js.map
// EXTERNAL MODULE: ./node_modules/@apidevtools/json-schema-ref-parser/dist/lib/index.js
var lib = __nccwpck_require__(8914);
// EXTERNAL MODULE: ./node_modules/@readme/better-ajv-errors/lib/index.js
var better_ajv_errors_lib = __nccwpck_require__(3193);
;// CONCATENATED MODULE: ./node_modules/@readme/openapi-schemas/dist/index.mjs
// src/schemas/v1.2/apiDeclaration.json
var apiDeclaration_default = {
  id: "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/schemas/v1.2/apiDeclaration.json#",
  $schema: "http://json-schema.org/draft-04/schema#",
  type: "object",
  required: ["swaggerVersion", "basePath", "apis"],
  properties: {
    swaggerVersion: { enum: ["1.2"] },
    apiVersion: { type: "string" },
    basePath: {
      type: "string",
      format: "uri",
      pattern: "^https?://"
    },
    resourcePath: {
      type: "string",
      format: "uri",
      pattern: "^/"
    },
    apis: {
      type: "array",
      items: { $ref: "#/definitions/apiObject" }
    },
    models: {
      type: "object",
      additionalProperties: {
        $ref: "modelsObject.json#"
      }
    },
    produces: { $ref: "#/definitions/mimeTypeArray" },
    consumes: { $ref: "#/definitions/mimeTypeArray" },
    authorizations: { $ref: "authorizationObject.json#" }
  },
  additionalProperties: false,
  definitions: {
    apiObject: {
      type: "object",
      required: ["path", "operations"],
      properties: {
        path: {
          type: "string",
          format: "uri-template",
          pattern: "^/"
        },
        description: { type: "string" },
        operations: {
          type: "array",
          items: { $ref: "operationObject.json#" }
        }
      },
      additionalProperties: false
    },
    mimeTypeArray: {
      type: "array",
      items: {
        type: "string",
        format: "mime-type"
      },
      uniqueItems: true
    }
  }
};

// src/schemas/v2.0/schema.json
var schema_default = {
  title: "A JSON Schema for Swagger 2.0 API.",
  id: "http://swagger.io/v2/schema.json#",
  $schema: "http://json-schema.org/draft-04/schema#",
  type: "object",
  required: [
    "swagger",
    "info",
    "paths"
  ],
  additionalProperties: false,
  patternProperties: {
    "^x-": {
      $ref: "#/definitions/vendorExtension"
    }
  },
  properties: {
    swagger: {
      type: "string",
      enum: [
        "2.0"
      ],
      description: "The Swagger version of this document."
    },
    info: {
      $ref: "#/definitions/info"
    },
    host: {
      type: "string",
      pattern: "^[^{}/ :\\\\]+(?::\\d+)?$",
      description: "The host (name or ip) of the API. Example: 'swagger.io'"
    },
    basePath: {
      type: "string",
      pattern: "^/",
      description: "The base path to the API. Example: '/api'."
    },
    schemes: {
      $ref: "#/definitions/schemesList"
    },
    consumes: {
      description: "A list of MIME types accepted by the API.",
      allOf: [
        {
          $ref: "#/definitions/mediaTypeList"
        }
      ]
    },
    produces: {
      description: "A list of MIME types the API can produce.",
      allOf: [
        {
          $ref: "#/definitions/mediaTypeList"
        }
      ]
    },
    paths: {
      $ref: "#/definitions/paths"
    },
    definitions: {
      $ref: "#/definitions/definitions"
    },
    parameters: {
      $ref: "#/definitions/parameterDefinitions"
    },
    responses: {
      $ref: "#/definitions/responseDefinitions"
    },
    security: {
      $ref: "#/definitions/security"
    },
    securityDefinitions: {
      $ref: "#/definitions/securityDefinitions"
    },
    tags: {
      type: "array",
      items: {
        $ref: "#/definitions/tag"
      },
      uniqueItems: true
    },
    externalDocs: {
      $ref: "#/definitions/externalDocs"
    }
  },
  definitions: {
    info: {
      type: "object",
      description: "General information about the API.",
      required: [
        "version",
        "title"
      ],
      additionalProperties: false,
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      },
      properties: {
        title: {
          type: "string",
          description: "A unique and precise title of the API."
        },
        version: {
          type: "string",
          description: "A semantic version number of the API."
        },
        description: {
          type: "string",
          description: "A longer description of the API. Should be different from the title.  GitHub Flavored Markdown is allowed."
        },
        termsOfService: {
          type: "string",
          description: "The terms of service for the API."
        },
        contact: {
          $ref: "#/definitions/contact"
        },
        license: {
          $ref: "#/definitions/license"
        }
      }
    },
    contact: {
      type: "object",
      description: "Contact information for the owners of the API.",
      additionalProperties: false,
      properties: {
        name: {
          type: "string",
          description: "The identifying name of the contact person/organization."
        },
        url: {
          type: "string",
          description: "The URL pointing to the contact information.",
          format: "uri"
        },
        email: {
          type: "string",
          description: "The email address of the contact person/organization.",
          format: "email"
        }
      },
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      }
    },
    license: {
      type: "object",
      required: [
        "name"
      ],
      additionalProperties: false,
      properties: {
        name: {
          type: "string",
          description: "The name of the license type. It's encouraged to use an OSI compatible license."
        },
        url: {
          type: "string",
          description: "The URL pointing to the license.",
          format: "uri"
        }
      },
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      }
    },
    paths: {
      type: "object",
      description: "Relative paths to the individual endpoints. They must be relative to the 'basePath'.",
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        },
        "^/": {
          $ref: "#/definitions/pathItem"
        }
      },
      additionalProperties: false
    },
    definitions: {
      type: "object",
      additionalProperties: {
        $ref: "#/definitions/schema"
      },
      description: "One or more JSON objects describing the schemas being consumed and produced by the API."
    },
    parameterDefinitions: {
      type: "object",
      additionalProperties: {
        $ref: "#/definitions/parameter"
      },
      description: "One or more JSON representations for parameters"
    },
    responseDefinitions: {
      type: "object",
      additionalProperties: {
        $ref: "#/definitions/response"
      },
      description: "One or more JSON representations for responses"
    },
    externalDocs: {
      type: "object",
      additionalProperties: false,
      description: "information about external documentation",
      required: [
        "url"
      ],
      properties: {
        description: {
          type: "string"
        },
        url: {
          type: "string",
          format: "uri"
        }
      },
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      }
    },
    examples: {
      type: "object",
      additionalProperties: true
    },
    mimeType: {
      type: "string",
      description: "The MIME type of the HTTP message."
    },
    operation: {
      type: "object",
      required: [
        "responses"
      ],
      additionalProperties: false,
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      },
      properties: {
        tags: {
          type: "array",
          items: {
            type: "string"
          },
          uniqueItems: true
        },
        summary: {
          type: "string",
          description: "A brief summary of the operation."
        },
        description: {
          type: "string",
          description: "A longer description of the operation, GitHub Flavored Markdown is allowed."
        },
        externalDocs: {
          $ref: "#/definitions/externalDocs"
        },
        operationId: {
          type: "string",
          description: "A unique identifier of the operation."
        },
        produces: {
          description: "A list of MIME types the API can produce.",
          allOf: [
            {
              $ref: "#/definitions/mediaTypeList"
            }
          ]
        },
        consumes: {
          description: "A list of MIME types the API can consume.",
          allOf: [
            {
              $ref: "#/definitions/mediaTypeList"
            }
          ]
        },
        parameters: {
          $ref: "#/definitions/parametersList"
        },
        responses: {
          $ref: "#/definitions/responses"
        },
        schemes: {
          $ref: "#/definitions/schemesList"
        },
        deprecated: {
          type: "boolean",
          default: false
        },
        security: {
          $ref: "#/definitions/security"
        }
      }
    },
    pathItem: {
      type: "object",
      additionalProperties: false,
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      },
      properties: {
        $ref: {
          type: "string"
        },
        get: {
          $ref: "#/definitions/operation"
        },
        put: {
          $ref: "#/definitions/operation"
        },
        post: {
          $ref: "#/definitions/operation"
        },
        delete: {
          $ref: "#/definitions/operation"
        },
        options: {
          $ref: "#/definitions/operation"
        },
        head: {
          $ref: "#/definitions/operation"
        },
        patch: {
          $ref: "#/definitions/operation"
        },
        parameters: {
          $ref: "#/definitions/parametersList"
        }
      }
    },
    responses: {
      type: "object",
      description: "Response objects names can either be any valid HTTP status code or 'default'.",
      minProperties: 1,
      additionalProperties: false,
      patternProperties: {
        "^([0-9]{3})$|^(default)$": {
          $ref: "#/definitions/responseValue"
        },
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      },
      not: {
        type: "object",
        additionalProperties: false,
        patternProperties: {
          "^x-": {
            $ref: "#/definitions/vendorExtension"
          }
        }
      }
    },
    responseValue: {
      oneOf: [
        {
          $ref: "#/definitions/response"
        },
        {
          $ref: "#/definitions/jsonReference"
        }
      ]
    },
    response: {
      type: "object",
      required: [
        "description"
      ],
      properties: {
        description: {
          type: "string"
        },
        schema: {
          oneOf: [
            {
              $ref: "#/definitions/schema"
            },
            {
              $ref: "#/definitions/fileSchema"
            }
          ]
        },
        headers: {
          $ref: "#/definitions/headers"
        },
        examples: {
          $ref: "#/definitions/examples"
        }
      },
      additionalProperties: false,
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      }
    },
    headers: {
      type: "object",
      additionalProperties: {
        $ref: "#/definitions/header"
      }
    },
    header: {
      type: "object",
      additionalProperties: false,
      required: [
        "type"
      ],
      properties: {
        type: {
          type: "string",
          enum: [
            "string",
            "number",
            "integer",
            "boolean",
            "array"
          ]
        },
        format: {
          type: "string"
        },
        items: {
          $ref: "#/definitions/primitivesItems"
        },
        collectionFormat: {
          $ref: "#/definitions/collectionFormat"
        },
        default: {
          $ref: "#/definitions/default"
        },
        maximum: {
          $ref: "#/definitions/maximum"
        },
        exclusiveMaximum: {
          $ref: "#/definitions/exclusiveMaximum"
        },
        minimum: {
          $ref: "#/definitions/minimum"
        },
        exclusiveMinimum: {
          $ref: "#/definitions/exclusiveMinimum"
        },
        maxLength: {
          $ref: "#/definitions/maxLength"
        },
        minLength: {
          $ref: "#/definitions/minLength"
        },
        pattern: {
          $ref: "#/definitions/pattern"
        },
        maxItems: {
          $ref: "#/definitions/maxItems"
        },
        minItems: {
          $ref: "#/definitions/minItems"
        },
        uniqueItems: {
          $ref: "#/definitions/uniqueItems"
        },
        enum: {
          $ref: "#/definitions/enum"
        },
        multipleOf: {
          $ref: "#/definitions/multipleOf"
        },
        description: {
          type: "string"
        }
      },
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      }
    },
    vendorExtension: {
      description: "Any property starting with x- is valid.",
      additionalProperties: true,
      additionalItems: true
    },
    bodyParameter: {
      type: "object",
      required: [
        "name",
        "in",
        "schema"
      ],
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      },
      properties: {
        description: {
          type: "string",
          description: "A brief description of the parameter. This could contain examples of use.  GitHub Flavored Markdown is allowed."
        },
        name: {
          type: "string",
          description: "The name of the parameter."
        },
        in: {
          type: "string",
          description: "Determines the location of the parameter.",
          enum: [
            "body"
          ]
        },
        required: {
          type: "boolean",
          description: "Determines whether or not this parameter is required or optional.",
          default: false
        },
        schema: {
          $ref: "#/definitions/schema"
        }
      },
      additionalProperties: false
    },
    headerParameterSubSchema: {
      additionalProperties: false,
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      },
      properties: {
        required: {
          type: "boolean",
          description: "Determines whether or not this parameter is required or optional.",
          default: false
        },
        in: {
          type: "string",
          description: "Determines the location of the parameter.",
          enum: [
            "header"
          ]
        },
        description: {
          type: "string",
          description: "A brief description of the parameter. This could contain examples of use.  GitHub Flavored Markdown is allowed."
        },
        name: {
          type: "string",
          description: "The name of the parameter."
        },
        type: {
          type: "string",
          enum: [
            "string",
            "number",
            "boolean",
            "integer",
            "array"
          ]
        },
        format: {
          type: "string"
        },
        items: {
          $ref: "#/definitions/primitivesItems"
        },
        collectionFormat: {
          $ref: "#/definitions/collectionFormat"
        },
        default: {
          $ref: "#/definitions/default"
        },
        maximum: {
          $ref: "#/definitions/maximum"
        },
        exclusiveMaximum: {
          $ref: "#/definitions/exclusiveMaximum"
        },
        minimum: {
          $ref: "#/definitions/minimum"
        },
        exclusiveMinimum: {
          $ref: "#/definitions/exclusiveMinimum"
        },
        maxLength: {
          $ref: "#/definitions/maxLength"
        },
        minLength: {
          $ref: "#/definitions/minLength"
        },
        pattern: {
          $ref: "#/definitions/pattern"
        },
        maxItems: {
          $ref: "#/definitions/maxItems"
        },
        minItems: {
          $ref: "#/definitions/minItems"
        },
        uniqueItems: {
          $ref: "#/definitions/uniqueItems"
        },
        enum: {
          $ref: "#/definitions/enum"
        },
        multipleOf: {
          $ref: "#/definitions/multipleOf"
        }
      }
    },
    queryParameterSubSchema: {
      additionalProperties: false,
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      },
      properties: {
        required: {
          type: "boolean",
          description: "Determines whether or not this parameter is required or optional.",
          default: false
        },
        in: {
          type: "string",
          description: "Determines the location of the parameter.",
          enum: [
            "query"
          ]
        },
        description: {
          type: "string",
          description: "A brief description of the parameter. This could contain examples of use.  GitHub Flavored Markdown is allowed."
        },
        name: {
          type: "string",
          description: "The name of the parameter."
        },
        allowEmptyValue: {
          type: "boolean",
          default: false,
          description: "allows sending a parameter by name only or with an empty value."
        },
        type: {
          type: "string",
          enum: [
            "string",
            "number",
            "boolean",
            "integer",
            "array"
          ]
        },
        format: {
          type: "string"
        },
        items: {
          $ref: "#/definitions/primitivesItems"
        },
        collectionFormat: {
          $ref: "#/definitions/collectionFormatWithMulti"
        },
        default: {
          $ref: "#/definitions/default"
        },
        maximum: {
          $ref: "#/definitions/maximum"
        },
        exclusiveMaximum: {
          $ref: "#/definitions/exclusiveMaximum"
        },
        minimum: {
          $ref: "#/definitions/minimum"
        },
        exclusiveMinimum: {
          $ref: "#/definitions/exclusiveMinimum"
        },
        maxLength: {
          $ref: "#/definitions/maxLength"
        },
        minLength: {
          $ref: "#/definitions/minLength"
        },
        pattern: {
          $ref: "#/definitions/pattern"
        },
        maxItems: {
          $ref: "#/definitions/maxItems"
        },
        minItems: {
          $ref: "#/definitions/minItems"
        },
        uniqueItems: {
          $ref: "#/definitions/uniqueItems"
        },
        enum: {
          $ref: "#/definitions/enum"
        },
        multipleOf: {
          $ref: "#/definitions/multipleOf"
        }
      }
    },
    formDataParameterSubSchema: {
      additionalProperties: false,
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      },
      properties: {
        required: {
          type: "boolean",
          description: "Determines whether or not this parameter is required or optional.",
          default: false
        },
        in: {
          type: "string",
          description: "Determines the location of the parameter.",
          enum: [
            "formData"
          ]
        },
        description: {
          type: "string",
          description: "A brief description of the parameter. This could contain examples of use.  GitHub Flavored Markdown is allowed."
        },
        name: {
          type: "string",
          description: "The name of the parameter."
        },
        allowEmptyValue: {
          type: "boolean",
          default: false,
          description: "allows sending a parameter by name only or with an empty value."
        },
        type: {
          type: "string",
          enum: [
            "string",
            "number",
            "boolean",
            "integer",
            "array",
            "file"
          ]
        },
        format: {
          type: "string"
        },
        items: {
          $ref: "#/definitions/primitivesItems"
        },
        collectionFormat: {
          $ref: "#/definitions/collectionFormatWithMulti"
        },
        default: {
          $ref: "#/definitions/default"
        },
        maximum: {
          $ref: "#/definitions/maximum"
        },
        exclusiveMaximum: {
          $ref: "#/definitions/exclusiveMaximum"
        },
        minimum: {
          $ref: "#/definitions/minimum"
        },
        exclusiveMinimum: {
          $ref: "#/definitions/exclusiveMinimum"
        },
        maxLength: {
          $ref: "#/definitions/maxLength"
        },
        minLength: {
          $ref: "#/definitions/minLength"
        },
        pattern: {
          $ref: "#/definitions/pattern"
        },
        maxItems: {
          $ref: "#/definitions/maxItems"
        },
        minItems: {
          $ref: "#/definitions/minItems"
        },
        uniqueItems: {
          $ref: "#/definitions/uniqueItems"
        },
        enum: {
          $ref: "#/definitions/enum"
        },
        multipleOf: {
          $ref: "#/definitions/multipleOf"
        }
      }
    },
    pathParameterSubSchema: {
      additionalProperties: false,
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      },
      required: [
        "required"
      ],
      properties: {
        required: {
          type: "boolean",
          enum: [
            true
          ],
          description: "Determines whether or not this parameter is required or optional."
        },
        in: {
          type: "string",
          description: "Determines the location of the parameter.",
          enum: [
            "path"
          ]
        },
        description: {
          type: "string",
          description: "A brief description of the parameter. This could contain examples of use.  GitHub Flavored Markdown is allowed."
        },
        name: {
          type: "string",
          description: "The name of the parameter."
        },
        type: {
          type: "string",
          enum: [
            "string",
            "number",
            "boolean",
            "integer",
            "array"
          ]
        },
        format: {
          type: "string"
        },
        items: {
          $ref: "#/definitions/primitivesItems"
        },
        collectionFormat: {
          $ref: "#/definitions/collectionFormat"
        },
        default: {
          $ref: "#/definitions/default"
        },
        maximum: {
          $ref: "#/definitions/maximum"
        },
        exclusiveMaximum: {
          $ref: "#/definitions/exclusiveMaximum"
        },
        minimum: {
          $ref: "#/definitions/minimum"
        },
        exclusiveMinimum: {
          $ref: "#/definitions/exclusiveMinimum"
        },
        maxLength: {
          $ref: "#/definitions/maxLength"
        },
        minLength: {
          $ref: "#/definitions/minLength"
        },
        pattern: {
          $ref: "#/definitions/pattern"
        },
        maxItems: {
          $ref: "#/definitions/maxItems"
        },
        minItems: {
          $ref: "#/definitions/minItems"
        },
        uniqueItems: {
          $ref: "#/definitions/uniqueItems"
        },
        enum: {
          $ref: "#/definitions/enum"
        },
        multipleOf: {
          $ref: "#/definitions/multipleOf"
        }
      }
    },
    nonBodyParameter: {
      type: "object",
      required: [
        "name",
        "in",
        "type"
      ],
      oneOf: [
        {
          $ref: "#/definitions/headerParameterSubSchema"
        },
        {
          $ref: "#/definitions/formDataParameterSubSchema"
        },
        {
          $ref: "#/definitions/queryParameterSubSchema"
        },
        {
          $ref: "#/definitions/pathParameterSubSchema"
        }
      ]
    },
    parameter: {
      oneOf: [
        {
          $ref: "#/definitions/bodyParameter"
        },
        {
          $ref: "#/definitions/nonBodyParameter"
        }
      ]
    },
    schema: {
      type: "object",
      description: "A deterministic version of a JSON Schema object.",
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      },
      properties: {
        $ref: {
          type: "string"
        },
        format: {
          type: "string"
        },
        title: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/title"
        },
        description: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/description"
        },
        default: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/default"
        },
        multipleOf: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/multipleOf"
        },
        maximum: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/maximum"
        },
        exclusiveMaximum: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/exclusiveMaximum"
        },
        minimum: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/minimum"
        },
        exclusiveMinimum: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/exclusiveMinimum"
        },
        maxLength: {
          $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveInteger"
        },
        minLength: {
          $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveIntegerDefault0"
        },
        pattern: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/pattern"
        },
        maxItems: {
          $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveInteger"
        },
        minItems: {
          $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveIntegerDefault0"
        },
        uniqueItems: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/uniqueItems"
        },
        maxProperties: {
          $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveInteger"
        },
        minProperties: {
          $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveIntegerDefault0"
        },
        required: {
          $ref: "http://json-schema.org/draft-04/schema#/definitions/stringArray"
        },
        enum: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/enum"
        },
        additionalProperties: {
          anyOf: [
            {
              $ref: "#/definitions/schema"
            },
            {
              type: "boolean"
            }
          ],
          default: {}
        },
        type: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/type"
        },
        items: {
          anyOf: [
            {
              $ref: "#/definitions/schema"
            },
            {
              type: "array",
              minItems: 1,
              items: {
                $ref: "#/definitions/schema"
              }
            }
          ],
          default: {}
        },
        allOf: {
          type: "array",
          minItems: 1,
          items: {
            $ref: "#/definitions/schema"
          }
        },
        properties: {
          type: "object",
          additionalProperties: {
            $ref: "#/definitions/schema"
          },
          default: {}
        },
        discriminator: {
          type: "string"
        },
        readOnly: {
          type: "boolean",
          default: false
        },
        xml: {
          $ref: "#/definitions/xml"
        },
        externalDocs: {
          $ref: "#/definitions/externalDocs"
        },
        example: {}
      },
      additionalProperties: false
    },
    fileSchema: {
      type: "object",
      description: "A deterministic version of a JSON Schema object.",
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      },
      required: [
        "type"
      ],
      properties: {
        format: {
          type: "string"
        },
        title: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/title"
        },
        description: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/description"
        },
        default: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/default"
        },
        required: {
          $ref: "http://json-schema.org/draft-04/schema#/definitions/stringArray"
        },
        type: {
          type: "string",
          enum: [
            "file"
          ]
        },
        readOnly: {
          type: "boolean",
          default: false
        },
        externalDocs: {
          $ref: "#/definitions/externalDocs"
        },
        example: {}
      },
      additionalProperties: false
    },
    primitivesItems: {
      type: "object",
      additionalProperties: false,
      properties: {
        type: {
          type: "string",
          enum: [
            "string",
            "number",
            "integer",
            "boolean",
            "array"
          ]
        },
        format: {
          type: "string"
        },
        items: {
          $ref: "#/definitions/primitivesItems"
        },
        collectionFormat: {
          $ref: "#/definitions/collectionFormat"
        },
        default: {
          $ref: "#/definitions/default"
        },
        maximum: {
          $ref: "#/definitions/maximum"
        },
        exclusiveMaximum: {
          $ref: "#/definitions/exclusiveMaximum"
        },
        minimum: {
          $ref: "#/definitions/minimum"
        },
        exclusiveMinimum: {
          $ref: "#/definitions/exclusiveMinimum"
        },
        maxLength: {
          $ref: "#/definitions/maxLength"
        },
        minLength: {
          $ref: "#/definitions/minLength"
        },
        pattern: {
          $ref: "#/definitions/pattern"
        },
        maxItems: {
          $ref: "#/definitions/maxItems"
        },
        minItems: {
          $ref: "#/definitions/minItems"
        },
        uniqueItems: {
          $ref: "#/definitions/uniqueItems"
        },
        enum: {
          $ref: "#/definitions/enum"
        },
        multipleOf: {
          $ref: "#/definitions/multipleOf"
        }
      },
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      }
    },
    security: {
      type: "array",
      items: {
        $ref: "#/definitions/securityRequirement"
      },
      uniqueItems: true
    },
    securityRequirement: {
      type: "object",
      additionalProperties: {
        type: "array",
        items: {
          type: "string"
        },
        uniqueItems: true
      }
    },
    xml: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: {
          type: "string"
        },
        namespace: {
          type: "string"
        },
        prefix: {
          type: "string"
        },
        attribute: {
          type: "boolean",
          default: false
        },
        wrapped: {
          type: "boolean",
          default: false
        }
      },
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      }
    },
    tag: {
      type: "object",
      additionalProperties: false,
      required: [
        "name"
      ],
      properties: {
        name: {
          type: "string"
        },
        description: {
          type: "string"
        },
        externalDocs: {
          $ref: "#/definitions/externalDocs"
        }
      },
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      }
    },
    securityDefinitions: {
      type: "object",
      additionalProperties: {
        oneOf: [
          {
            $ref: "#/definitions/basicAuthenticationSecurity"
          },
          {
            $ref: "#/definitions/apiKeySecurity"
          },
          {
            $ref: "#/definitions/oauth2ImplicitSecurity"
          },
          {
            $ref: "#/definitions/oauth2PasswordSecurity"
          },
          {
            $ref: "#/definitions/oauth2ApplicationSecurity"
          },
          {
            $ref: "#/definitions/oauth2AccessCodeSecurity"
          }
        ]
      }
    },
    basicAuthenticationSecurity: {
      type: "object",
      additionalProperties: false,
      required: [
        "type"
      ],
      properties: {
        type: {
          type: "string",
          enum: [
            "basic"
          ]
        },
        description: {
          type: "string"
        }
      },
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      }
    },
    apiKeySecurity: {
      type: "object",
      additionalProperties: false,
      required: [
        "type",
        "name",
        "in"
      ],
      properties: {
        type: {
          type: "string",
          enum: [
            "apiKey"
          ]
        },
        name: {
          type: "string"
        },
        in: {
          type: "string",
          enum: [
            "header",
            "query"
          ]
        },
        description: {
          type: "string"
        }
      },
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      }
    },
    oauth2ImplicitSecurity: {
      type: "object",
      additionalProperties: false,
      required: [
        "type",
        "flow",
        "authorizationUrl"
      ],
      properties: {
        type: {
          type: "string",
          enum: [
            "oauth2"
          ]
        },
        flow: {
          type: "string",
          enum: [
            "implicit"
          ]
        },
        scopes: {
          $ref: "#/definitions/oauth2Scopes"
        },
        authorizationUrl: {
          type: "string",
          format: "uri"
        },
        description: {
          type: "string"
        }
      },
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      }
    },
    oauth2PasswordSecurity: {
      type: "object",
      additionalProperties: false,
      required: [
        "type",
        "flow",
        "tokenUrl"
      ],
      properties: {
        type: {
          type: "string",
          enum: [
            "oauth2"
          ]
        },
        flow: {
          type: "string",
          enum: [
            "password"
          ]
        },
        scopes: {
          $ref: "#/definitions/oauth2Scopes"
        },
        tokenUrl: {
          type: "string",
          format: "uri"
        },
        description: {
          type: "string"
        }
      },
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      }
    },
    oauth2ApplicationSecurity: {
      type: "object",
      additionalProperties: false,
      required: [
        "type",
        "flow",
        "tokenUrl"
      ],
      properties: {
        type: {
          type: "string",
          enum: [
            "oauth2"
          ]
        },
        flow: {
          type: "string",
          enum: [
            "application"
          ]
        },
        scopes: {
          $ref: "#/definitions/oauth2Scopes"
        },
        tokenUrl: {
          type: "string",
          format: "uri"
        },
        description: {
          type: "string"
        }
      },
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      }
    },
    oauth2AccessCodeSecurity: {
      type: "object",
      additionalProperties: false,
      required: [
        "type",
        "flow",
        "authorizationUrl",
        "tokenUrl"
      ],
      properties: {
        type: {
          type: "string",
          enum: [
            "oauth2"
          ]
        },
        flow: {
          type: "string",
          enum: [
            "accessCode"
          ]
        },
        scopes: {
          $ref: "#/definitions/oauth2Scopes"
        },
        authorizationUrl: {
          type: "string",
          format: "uri"
        },
        tokenUrl: {
          type: "string",
          format: "uri"
        },
        description: {
          type: "string"
        }
      },
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      }
    },
    oauth2Scopes: {
      type: "object",
      additionalProperties: {
        type: "string"
      }
    },
    mediaTypeList: {
      type: "array",
      items: {
        $ref: "#/definitions/mimeType"
      },
      uniqueItems: true
    },
    parametersList: {
      type: "array",
      description: "The parameters needed to send a valid API call.",
      additionalItems: false,
      items: {
        oneOf: [
          {
            $ref: "#/definitions/parameter"
          },
          {
            $ref: "#/definitions/jsonReference"
          }
        ]
      },
      uniqueItems: true
    },
    schemesList: {
      type: "array",
      description: "The transfer protocol of the API.",
      items: {
        type: "string",
        enum: [
          "http",
          "https",
          "ws",
          "wss"
        ]
      },
      uniqueItems: true
    },
    collectionFormat: {
      type: "string",
      enum: [
        "csv",
        "ssv",
        "tsv",
        "pipes"
      ],
      default: "csv"
    },
    collectionFormatWithMulti: {
      type: "string",
      enum: [
        "csv",
        "ssv",
        "tsv",
        "pipes",
        "multi"
      ],
      default: "csv"
    },
    title: {
      $ref: "http://json-schema.org/draft-04/schema#/properties/title"
    },
    description: {
      $ref: "http://json-schema.org/draft-04/schema#/properties/description"
    },
    default: {
      $ref: "http://json-schema.org/draft-04/schema#/properties/default"
    },
    multipleOf: {
      $ref: "http://json-schema.org/draft-04/schema#/properties/multipleOf"
    },
    maximum: {
      $ref: "http://json-schema.org/draft-04/schema#/properties/maximum"
    },
    exclusiveMaximum: {
      $ref: "http://json-schema.org/draft-04/schema#/properties/exclusiveMaximum"
    },
    minimum: {
      $ref: "http://json-schema.org/draft-04/schema#/properties/minimum"
    },
    exclusiveMinimum: {
      $ref: "http://json-schema.org/draft-04/schema#/properties/exclusiveMinimum"
    },
    maxLength: {
      $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveInteger"
    },
    minLength: {
      $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveIntegerDefault0"
    },
    pattern: {
      $ref: "http://json-schema.org/draft-04/schema#/properties/pattern"
    },
    maxItems: {
      $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveInteger"
    },
    minItems: {
      $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveIntegerDefault0"
    },
    uniqueItems: {
      $ref: "http://json-schema.org/draft-04/schema#/properties/uniqueItems"
    },
    enum: {
      $ref: "http://json-schema.org/draft-04/schema#/properties/enum"
    },
    jsonReference: {
      type: "object",
      required: [
        "$ref"
      ],
      additionalProperties: false,
      properties: {
        $ref: {
          type: "string"
        }
      }
    }
  }
};

// src/schemas/v3.0/schema.json
var schema_default2 = {
  id: "https://spec.openapis.org/oas/3.0/schema/2021-09-28",
  $schema: "http://json-schema.org/draft-04/schema#",
  description: "The description of OpenAPI v3.0.x documents, as defined by https://spec.openapis.org/oas/v3.0.3",
  type: "object",
  required: [
    "openapi",
    "info",
    "paths"
  ],
  properties: {
    openapi: {
      type: "string",
      pattern: "^3\\.0\\.\\d(-.+)?$"
    },
    info: {
      $ref: "#/definitions/Info"
    },
    externalDocs: {
      $ref: "#/definitions/ExternalDocumentation"
    },
    servers: {
      type: "array",
      items: {
        $ref: "#/definitions/Server"
      }
    },
    security: {
      type: "array",
      items: {
        $ref: "#/definitions/SecurityRequirement"
      }
    },
    tags: {
      type: "array",
      items: {
        $ref: "#/definitions/Tag"
      },
      uniqueItems: true
    },
    paths: {
      $ref: "#/definitions/Paths"
    },
    components: {
      $ref: "#/definitions/Components"
    }
  },
  patternProperties: {
    "^x-": {}
  },
  additionalProperties: false,
  definitions: {
    Reference: {
      type: "object",
      required: [
        "$ref"
      ],
      patternProperties: {
        "^\\$ref$": {
          type: "string",
          format: "uri-reference"
        }
      }
    },
    Info: {
      type: "object",
      required: [
        "title",
        "version"
      ],
      properties: {
        title: {
          type: "string"
        },
        description: {
          type: "string"
        },
        termsOfService: {
          type: "string",
          format: "uri-reference"
        },
        contact: {
          $ref: "#/definitions/Contact"
        },
        license: {
          $ref: "#/definitions/License"
        },
        version: {
          type: "string"
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    Contact: {
      type: "object",
      properties: {
        name: {
          type: "string"
        },
        url: {
          type: "string",
          format: "uri-reference"
        },
        email: {
          type: "string",
          format: "email"
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    License: {
      type: "object",
      required: [
        "name"
      ],
      properties: {
        name: {
          type: "string"
        },
        url: {
          type: "string",
          format: "uri-reference"
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    Server: {
      type: "object",
      required: [
        "url"
      ],
      properties: {
        url: {
          type: "string"
        },
        description: {
          type: "string"
        },
        variables: {
          type: "object",
          additionalProperties: {
            $ref: "#/definitions/ServerVariable"
          }
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    ServerVariable: {
      type: "object",
      required: [
        "default"
      ],
      properties: {
        enum: {
          type: "array",
          items: {
            type: "string"
          }
        },
        default: {
          type: "string"
        },
        description: {
          type: "string"
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    Components: {
      type: "object",
      properties: {
        schemas: {
          type: "object",
          patternProperties: {
            "^[a-zA-Z0-9\\.\\-_]+$": {
              oneOf: [
                {
                  $ref: "#/definitions/Schema"
                },
                {
                  $ref: "#/definitions/Reference"
                }
              ]
            }
          }
        },
        responses: {
          type: "object",
          patternProperties: {
            "^[a-zA-Z0-9\\.\\-_]+$": {
              oneOf: [
                {
                  $ref: "#/definitions/Reference"
                },
                {
                  $ref: "#/definitions/Response"
                }
              ]
            }
          }
        },
        parameters: {
          type: "object",
          patternProperties: {
            "^[a-zA-Z0-9\\.\\-_]+$": {
              oneOf: [
                {
                  $ref: "#/definitions/Reference"
                },
                {
                  $ref: "#/definitions/Parameter"
                }
              ]
            }
          }
        },
        examples: {
          type: "object",
          patternProperties: {
            "^[a-zA-Z0-9\\.\\-_]+$": {
              oneOf: [
                {
                  $ref: "#/definitions/Reference"
                },
                {
                  $ref: "#/definitions/Example"
                }
              ]
            }
          }
        },
        requestBodies: {
          type: "object",
          patternProperties: {
            "^[a-zA-Z0-9\\.\\-_]+$": {
              oneOf: [
                {
                  $ref: "#/definitions/Reference"
                },
                {
                  $ref: "#/definitions/RequestBody"
                }
              ]
            }
          }
        },
        headers: {
          type: "object",
          patternProperties: {
            "^[a-zA-Z0-9\\.\\-_]+$": {
              oneOf: [
                {
                  $ref: "#/definitions/Reference"
                },
                {
                  $ref: "#/definitions/Header"
                }
              ]
            }
          }
        },
        securitySchemes: {
          type: "object",
          patternProperties: {
            "^[a-zA-Z0-9\\.\\-_]+$": {
              oneOf: [
                {
                  $ref: "#/definitions/Reference"
                },
                {
                  $ref: "#/definitions/SecurityScheme"
                }
              ]
            }
          }
        },
        links: {
          type: "object",
          patternProperties: {
            "^[a-zA-Z0-9\\.\\-_]+$": {
              oneOf: [
                {
                  $ref: "#/definitions/Reference"
                },
                {
                  $ref: "#/definitions/Link"
                }
              ]
            }
          }
        },
        callbacks: {
          type: "object",
          patternProperties: {
            "^[a-zA-Z0-9\\.\\-_]+$": {
              oneOf: [
                {
                  $ref: "#/definitions/Reference"
                },
                {
                  $ref: "#/definitions/Callback"
                }
              ]
            }
          }
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    Schema: {
      type: "object",
      properties: {
        title: {
          type: "string"
        },
        multipleOf: {
          type: "number",
          minimum: 0,
          exclusiveMinimum: true
        },
        maximum: {
          type: "number"
        },
        exclusiveMaximum: {
          type: "boolean",
          default: false
        },
        minimum: {
          type: "number"
        },
        exclusiveMinimum: {
          type: "boolean",
          default: false
        },
        maxLength: {
          type: "integer",
          minimum: 0
        },
        minLength: {
          type: "integer",
          minimum: 0,
          default: 0
        },
        pattern: {
          type: "string",
          format: "regex"
        },
        maxItems: {
          type: "integer",
          minimum: 0
        },
        minItems: {
          type: "integer",
          minimum: 0,
          default: 0
        },
        uniqueItems: {
          type: "boolean",
          default: false
        },
        maxProperties: {
          type: "integer",
          minimum: 0
        },
        minProperties: {
          type: "integer",
          minimum: 0,
          default: 0
        },
        required: {
          type: "array",
          items: {
            type: "string"
          },
          minItems: 1,
          uniqueItems: true
        },
        enum: {
          type: "array",
          items: {},
          minItems: 1,
          uniqueItems: false
        },
        type: {
          type: "string",
          enum: [
            "array",
            "boolean",
            "integer",
            "number",
            "object",
            "string"
          ]
        },
        not: {
          oneOf: [
            {
              $ref: "#/definitions/Schema"
            },
            {
              $ref: "#/definitions/Reference"
            }
          ]
        },
        allOf: {
          type: "array",
          items: {
            oneOf: [
              {
                $ref: "#/definitions/Schema"
              },
              {
                $ref: "#/definitions/Reference"
              }
            ]
          }
        },
        oneOf: {
          type: "array",
          items: {
            oneOf: [
              {
                $ref: "#/definitions/Schema"
              },
              {
                $ref: "#/definitions/Reference"
              }
            ]
          }
        },
        anyOf: {
          type: "array",
          items: {
            oneOf: [
              {
                $ref: "#/definitions/Schema"
              },
              {
                $ref: "#/definitions/Reference"
              }
            ]
          }
        },
        items: {
          oneOf: [
            {
              $ref: "#/definitions/Schema"
            },
            {
              $ref: "#/definitions/Reference"
            }
          ]
        },
        properties: {
          type: "object",
          additionalProperties: {
            oneOf: [
              {
                $ref: "#/definitions/Schema"
              },
              {
                $ref: "#/definitions/Reference"
              }
            ]
          }
        },
        additionalProperties: {
          oneOf: [
            {
              $ref: "#/definitions/Schema"
            },
            {
              $ref: "#/definitions/Reference"
            },
            {
              type: "boolean"
            }
          ],
          default: true
        },
        description: {
          type: "string"
        },
        format: {
          type: "string"
        },
        default: {},
        nullable: {
          type: "boolean",
          default: false
        },
        discriminator: {
          $ref: "#/definitions/Discriminator"
        },
        readOnly: {
          type: "boolean",
          default: false
        },
        writeOnly: {
          type: "boolean",
          default: false
        },
        example: {},
        externalDocs: {
          $ref: "#/definitions/ExternalDocumentation"
        },
        deprecated: {
          type: "boolean",
          default: false
        },
        xml: {
          $ref: "#/definitions/XML"
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    Discriminator: {
      type: "object",
      required: [
        "propertyName"
      ],
      properties: {
        propertyName: {
          type: "string"
        },
        mapping: {
          type: "object",
          additionalProperties: {
            type: "string"
          }
        }
      }
    },
    XML: {
      type: "object",
      properties: {
        name: {
          type: "string"
        },
        namespace: {
          type: "string",
          format: "uri"
        },
        prefix: {
          type: "string"
        },
        attribute: {
          type: "boolean",
          default: false
        },
        wrapped: {
          type: "boolean",
          default: false
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    Response: {
      type: "object",
      required: [
        "description"
      ],
      properties: {
        description: {
          type: "string"
        },
        headers: {
          type: "object",
          additionalProperties: {
            oneOf: [
              {
                $ref: "#/definitions/Header"
              },
              {
                $ref: "#/definitions/Reference"
              }
            ]
          }
        },
        content: {
          type: "object",
          additionalProperties: {
            $ref: "#/definitions/MediaType"
          }
        },
        links: {
          type: "object",
          additionalProperties: {
            oneOf: [
              {
                $ref: "#/definitions/Link"
              },
              {
                $ref: "#/definitions/Reference"
              }
            ]
          }
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    MediaType: {
      type: "object",
      properties: {
        schema: {
          oneOf: [
            {
              $ref: "#/definitions/Schema"
            },
            {
              $ref: "#/definitions/Reference"
            }
          ]
        },
        example: {},
        examples: {
          type: "object",
          additionalProperties: {
            oneOf: [
              {
                $ref: "#/definitions/Example"
              },
              {
                $ref: "#/definitions/Reference"
              }
            ]
          }
        },
        encoding: {
          type: "object",
          additionalProperties: {
            $ref: "#/definitions/Encoding"
          }
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false,
      allOf: [
        {
          $ref: "#/definitions/ExampleXORExamples"
        }
      ]
    },
    Example: {
      type: "object",
      properties: {
        summary: {
          type: "string"
        },
        description: {
          type: "string"
        },
        value: {},
        externalValue: {
          type: "string",
          format: "uri-reference"
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    Header: {
      type: "object",
      properties: {
        description: {
          type: "string"
        },
        required: {
          type: "boolean",
          default: false
        },
        deprecated: {
          type: "boolean",
          default: false
        },
        allowEmptyValue: {
          type: "boolean",
          default: false
        },
        style: {
          type: "string",
          enum: [
            "simple"
          ],
          default: "simple"
        },
        explode: {
          type: "boolean"
        },
        allowReserved: {
          type: "boolean",
          default: false
        },
        schema: {
          oneOf: [
            {
              $ref: "#/definitions/Schema"
            },
            {
              $ref: "#/definitions/Reference"
            }
          ]
        },
        content: {
          type: "object",
          additionalProperties: {
            $ref: "#/definitions/MediaType"
          },
          minProperties: 1,
          maxProperties: 1
        },
        example: {},
        examples: {
          type: "object",
          additionalProperties: {
            oneOf: [
              {
                $ref: "#/definitions/Example"
              },
              {
                $ref: "#/definitions/Reference"
              }
            ]
          }
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false,
      allOf: [
        {
          $ref: "#/definitions/ExampleXORExamples"
        },
        {
          $ref: "#/definitions/SchemaXORContent"
        }
      ]
    },
    Paths: {
      type: "object",
      patternProperties: {
        "^\\/": {
          $ref: "#/definitions/PathItem"
        },
        "^x-": {}
      },
      additionalProperties: false
    },
    PathItem: {
      type: "object",
      properties: {
        $ref: {
          type: "string"
        },
        summary: {
          type: "string"
        },
        description: {
          type: "string"
        },
        servers: {
          type: "array",
          items: {
            $ref: "#/definitions/Server"
          }
        },
        parameters: {
          type: "array",
          items: {
            oneOf: [
              {
                $ref: "#/definitions/Parameter"
              },
              {
                $ref: "#/definitions/Reference"
              }
            ]
          },
          uniqueItems: true
        }
      },
      patternProperties: {
        "^(get|put|post|delete|options|head|patch|trace)$": {
          $ref: "#/definitions/Operation"
        },
        "^x-": {}
      },
      additionalProperties: false
    },
    Operation: {
      type: "object",
      required: [
        "responses"
      ],
      properties: {
        tags: {
          type: "array",
          items: {
            type: "string"
          }
        },
        summary: {
          type: "string"
        },
        description: {
          type: "string"
        },
        externalDocs: {
          $ref: "#/definitions/ExternalDocumentation"
        },
        operationId: {
          type: "string"
        },
        parameters: {
          type: "array",
          items: {
            oneOf: [
              {
                $ref: "#/definitions/Parameter"
              },
              {
                $ref: "#/definitions/Reference"
              }
            ]
          },
          uniqueItems: true
        },
        requestBody: {
          oneOf: [
            {
              $ref: "#/definitions/RequestBody"
            },
            {
              $ref: "#/definitions/Reference"
            }
          ]
        },
        responses: {
          $ref: "#/definitions/Responses"
        },
        callbacks: {
          type: "object",
          additionalProperties: {
            oneOf: [
              {
                $ref: "#/definitions/Callback"
              },
              {
                $ref: "#/definitions/Reference"
              }
            ]
          }
        },
        deprecated: {
          type: "boolean",
          default: false
        },
        security: {
          type: "array",
          items: {
            $ref: "#/definitions/SecurityRequirement"
          }
        },
        servers: {
          type: "array",
          items: {
            $ref: "#/definitions/Server"
          }
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    Responses: {
      type: "object",
      properties: {
        default: {
          oneOf: [
            {
              $ref: "#/definitions/Response"
            },
            {
              $ref: "#/definitions/Reference"
            }
          ]
        }
      },
      patternProperties: {
        "^[1-5](?:\\d{2}|XX)$": {
          oneOf: [
            {
              $ref: "#/definitions/Response"
            },
            {
              $ref: "#/definitions/Reference"
            }
          ]
        },
        "^x-": {}
      },
      minProperties: 1,
      additionalProperties: false
    },
    SecurityRequirement: {
      type: "object",
      additionalProperties: {
        type: "array",
        items: {
          type: "string"
        }
      }
    },
    Tag: {
      type: "object",
      required: [
        "name"
      ],
      properties: {
        name: {
          type: "string"
        },
        description: {
          type: "string"
        },
        externalDocs: {
          $ref: "#/definitions/ExternalDocumentation"
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    ExternalDocumentation: {
      type: "object",
      required: [
        "url"
      ],
      properties: {
        description: {
          type: "string"
        },
        url: {
          type: "string",
          format: "uri-reference"
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    ExampleXORExamples: {
      description: "Example and examples are mutually exclusive",
      not: {
        required: [
          "example",
          "examples"
        ]
      }
    },
    SchemaXORContent: {
      description: "Schema and content are mutually exclusive, at least one is required",
      not: {
        required: [
          "schema",
          "content"
        ]
      },
      oneOf: [
        {
          required: [
            "schema"
          ]
        },
        {
          required: [
            "content"
          ],
          description: "Some properties are not allowed if content is present",
          allOf: [
            {
              not: {
                required: [
                  "style"
                ]
              }
            },
            {
              not: {
                required: [
                  "explode"
                ]
              }
            },
            {
              not: {
                required: [
                  "allowReserved"
                ]
              }
            },
            {
              not: {
                required: [
                  "example"
                ]
              }
            },
            {
              not: {
                required: [
                  "examples"
                ]
              }
            }
          ]
        }
      ]
    },
    Parameter: {
      type: "object",
      properties: {
        name: {
          type: "string"
        },
        in: {
          type: "string"
        },
        description: {
          type: "string"
        },
        required: {
          type: "boolean",
          default: false
        },
        deprecated: {
          type: "boolean",
          default: false
        },
        allowEmptyValue: {
          type: "boolean",
          default: false
        },
        style: {
          type: "string"
        },
        explode: {
          type: "boolean"
        },
        allowReserved: {
          type: "boolean",
          default: false
        },
        schema: {
          oneOf: [
            {
              $ref: "#/definitions/Schema"
            },
            {
              $ref: "#/definitions/Reference"
            }
          ]
        },
        content: {
          type: "object",
          additionalProperties: {
            $ref: "#/definitions/MediaType"
          },
          minProperties: 1,
          maxProperties: 1
        },
        example: {},
        examples: {
          type: "object",
          additionalProperties: {
            oneOf: [
              {
                $ref: "#/definitions/Example"
              },
              {
                $ref: "#/definitions/Reference"
              }
            ]
          }
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false,
      required: [
        "name",
        "in"
      ],
      allOf: [
        {
          $ref: "#/definitions/ExampleXORExamples"
        },
        {
          $ref: "#/definitions/SchemaXORContent"
        },
        {
          $ref: "#/definitions/ParameterLocation"
        }
      ]
    },
    ParameterLocation: {
      description: "Parameter location",
      oneOf: [
        {
          description: "Parameter in path",
          required: [
            "required"
          ],
          properties: {
            in: {
              enum: [
                "path"
              ]
            },
            style: {
              enum: [
                "matrix",
                "label",
                "simple"
              ],
              default: "simple"
            },
            required: {
              enum: [
                true
              ]
            }
          }
        },
        {
          description: "Parameter in query",
          properties: {
            in: {
              enum: [
                "query"
              ]
            },
            style: {
              enum: [
                "form",
                "spaceDelimited",
                "pipeDelimited",
                "deepObject"
              ],
              default: "form"
            }
          }
        },
        {
          description: "Parameter in header",
          properties: {
            in: {
              enum: [
                "header"
              ]
            },
            style: {
              enum: [
                "simple"
              ],
              default: "simple"
            }
          }
        },
        {
          description: "Parameter in cookie",
          properties: {
            in: {
              enum: [
                "cookie"
              ]
            },
            style: {
              enum: [
                "form"
              ],
              default: "form"
            }
          }
        }
      ]
    },
    RequestBody: {
      type: "object",
      required: [
        "content"
      ],
      properties: {
        description: {
          type: "string"
        },
        content: {
          type: "object",
          additionalProperties: {
            $ref: "#/definitions/MediaType"
          }
        },
        required: {
          type: "boolean",
          default: false
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    SecurityScheme: {
      oneOf: [
        {
          $ref: "#/definitions/APIKeySecurityScheme"
        },
        {
          $ref: "#/definitions/HTTPSecurityScheme"
        },
        {
          $ref: "#/definitions/OAuth2SecurityScheme"
        },
        {
          $ref: "#/definitions/OpenIdConnectSecurityScheme"
        }
      ]
    },
    APIKeySecurityScheme: {
      type: "object",
      required: [
        "type",
        "name",
        "in"
      ],
      properties: {
        type: {
          type: "string",
          enum: [
            "apiKey"
          ]
        },
        name: {
          type: "string"
        },
        in: {
          type: "string",
          enum: [
            "header",
            "query",
            "cookie"
          ]
        },
        description: {
          type: "string"
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    HTTPSecurityScheme: {
      type: "object",
      required: [
        "scheme",
        "type"
      ],
      properties: {
        scheme: {
          type: "string"
        },
        bearerFormat: {
          type: "string"
        },
        description: {
          type: "string"
        },
        type: {
          type: "string",
          enum: [
            "http"
          ]
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false,
      oneOf: [
        {
          description: "Bearer",
          properties: {
            scheme: {
              type: "string",
              pattern: "^[Bb][Ee][Aa][Rr][Ee][Rr]$"
            }
          }
        },
        {
          description: "Non Bearer",
          not: {
            required: [
              "bearerFormat"
            ]
          },
          properties: {
            scheme: {
              not: {
                type: "string",
                pattern: "^[Bb][Ee][Aa][Rr][Ee][Rr]$"
              }
            }
          }
        }
      ]
    },
    OAuth2SecurityScheme: {
      type: "object",
      required: [
        "type",
        "flows"
      ],
      properties: {
        type: {
          type: "string",
          enum: [
            "oauth2"
          ]
        },
        flows: {
          $ref: "#/definitions/OAuthFlows"
        },
        description: {
          type: "string"
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    OpenIdConnectSecurityScheme: {
      type: "object",
      required: [
        "type",
        "openIdConnectUrl"
      ],
      properties: {
        type: {
          type: "string",
          enum: [
            "openIdConnect"
          ]
        },
        openIdConnectUrl: {
          type: "string",
          format: "uri-reference"
        },
        description: {
          type: "string"
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    OAuthFlows: {
      type: "object",
      properties: {
        implicit: {
          $ref: "#/definitions/ImplicitOAuthFlow"
        },
        password: {
          $ref: "#/definitions/PasswordOAuthFlow"
        },
        clientCredentials: {
          $ref: "#/definitions/ClientCredentialsFlow"
        },
        authorizationCode: {
          $ref: "#/definitions/AuthorizationCodeOAuthFlow"
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    ImplicitOAuthFlow: {
      type: "object",
      required: [
        "authorizationUrl",
        "scopes"
      ],
      properties: {
        authorizationUrl: {
          type: "string",
          format: "uri-reference"
        },
        refreshUrl: {
          type: "string",
          format: "uri-reference"
        },
        scopes: {
          type: "object",
          additionalProperties: {
            type: "string"
          }
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    PasswordOAuthFlow: {
      type: "object",
      required: [
        "tokenUrl",
        "scopes"
      ],
      properties: {
        tokenUrl: {
          type: "string",
          format: "uri-reference"
        },
        refreshUrl: {
          type: "string",
          format: "uri-reference"
        },
        scopes: {
          type: "object",
          additionalProperties: {
            type: "string"
          }
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    ClientCredentialsFlow: {
      type: "object",
      required: [
        "tokenUrl",
        "scopes"
      ],
      properties: {
        tokenUrl: {
          type: "string",
          format: "uri-reference"
        },
        refreshUrl: {
          type: "string",
          format: "uri-reference"
        },
        scopes: {
          type: "object",
          additionalProperties: {
            type: "string"
          }
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    AuthorizationCodeOAuthFlow: {
      type: "object",
      required: [
        "authorizationUrl",
        "tokenUrl",
        "scopes"
      ],
      properties: {
        authorizationUrl: {
          type: "string",
          format: "uri-reference"
        },
        tokenUrl: {
          type: "string",
          format: "uri-reference"
        },
        refreshUrl: {
          type: "string",
          format: "uri-reference"
        },
        scopes: {
          type: "object",
          additionalProperties: {
            type: "string"
          }
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    },
    Link: {
      type: "object",
      properties: {
        operationId: {
          type: "string"
        },
        operationRef: {
          type: "string",
          format: "uri-reference"
        },
        parameters: {
          type: "object",
          additionalProperties: {}
        },
        requestBody: {},
        description: {
          type: "string"
        },
        server: {
          $ref: "#/definitions/Server"
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false,
      not: {
        description: "Operation Id and Operation Ref are mutually exclusive",
        required: [
          "operationId",
          "operationRef"
        ]
      }
    },
    Callback: {
      type: "object",
      additionalProperties: {
        $ref: "#/definitions/PathItem"
      },
      patternProperties: {
        "^x-": {}
      }
    },
    Encoding: {
      type: "object",
      properties: {
        contentType: {
          type: "string"
        },
        headers: {
          type: "object",
          additionalProperties: {
            oneOf: [
              {
                $ref: "#/definitions/Header"
              },
              {
                $ref: "#/definitions/Reference"
              }
            ]
          }
        },
        style: {
          type: "string",
          enum: [
            "form",
            "spaceDelimited",
            "pipeDelimited",
            "deepObject"
          ]
        },
        explode: {
          type: "boolean"
        },
        allowReserved: {
          type: "boolean",
          default: false
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false
    }
  }
};

// src/schemas/v3.1/legacy-schema.json
var legacy_schema_default = {
  $id: "https://spec.openapis.org/oas/3.1/schema/2022-10-07",
  $schema: "https://json-schema.org/draft/2020-12/schema",
  description: "The description of OpenAPI v3.1.x documents without schema validation, as defined by https://spec.openapis.org/oas/v3.1.0",
  type: "object",
  properties: {
    openapi: {
      type: "string",
      pattern: "^3\\.1\\.\\d+(-.+)?$"
    },
    info: {
      $ref: "#/$defs/info"
    },
    jsonSchemaDialect: {
      type: "string",
      format: "uri",
      default: "https://spec.openapis.org/oas/3.1/dialect/base"
    },
    servers: {
      type: "array",
      items: {
        $ref: "#/$defs/server"
      },
      default: [
        {
          url: "/"
        }
      ]
    },
    paths: {
      $ref: "#/$defs/paths"
    },
    webhooks: {
      type: "object",
      additionalProperties: {
        $ref: "#/$defs/path-item-or-reference"
      }
    },
    components: {
      $ref: "#/$defs/components"
    },
    security: {
      type: "array",
      items: {
        $ref: "#/$defs/security-requirement"
      }
    },
    tags: {
      type: "array",
      items: {
        $ref: "#/$defs/tag"
      }
    },
    externalDocs: {
      $ref: "#/$defs/external-documentation"
    }
  },
  required: [
    "openapi",
    "info"
  ],
  anyOf: [
    {
      required: [
        "paths"
      ]
    },
    {
      required: [
        "components"
      ]
    },
    {
      required: [
        "webhooks"
      ]
    }
  ],
  $ref: "#/$defs/specification-extensions",
  unevaluatedProperties: false,
  $defs: {
    info: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#info-object",
      type: "object",
      properties: {
        title: {
          type: "string"
        },
        summary: {
          type: "string"
        },
        description: {
          type: "string"
        },
        termsOfService: {
          type: "string",
          format: "uri"
        },
        contact: {
          $ref: "#/$defs/contact"
        },
        license: {
          $ref: "#/$defs/license"
        },
        version: {
          type: "string"
        }
      },
      required: [
        "title",
        "version"
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    contact: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#contact-object",
      type: "object",
      properties: {
        name: {
          type: "string"
        },
        url: {
          type: "string",
          format: "uri"
        },
        email: {
          type: "string",
          format: "email"
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    license: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#license-object",
      type: "object",
      properties: {
        name: {
          type: "string"
        },
        identifier: {
          type: "string"
        },
        url: {
          type: "string",
          format: "uri"
        }
      },
      required: [
        "name"
      ],
      dependentSchemas: {
        identifier: {
          not: {
            required: [
              "url"
            ]
          }
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    server: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#server-object",
      type: "object",
      properties: {
        url: {
          type: "string",
          format: "uri-reference"
        },
        description: {
          type: "string"
        },
        variables: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/server-variable"
          }
        }
      },
      required: [
        "url"
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "server-variable": {
      $comment: "https://spec.openapis.org/oas/v3.1.0#server-variable-object",
      type: "object",
      properties: {
        enum: {
          type: "array",
          items: {
            type: "string"
          },
          minItems: 1
        },
        default: {
          type: "string"
        },
        description: {
          type: "string"
        }
      },
      required: [
        "default"
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    components: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#components-object",
      type: "object",
      properties: {
        schemas: {
          type: "object",
          additionalProperties: {
            $dynamicRef: "#meta"
          }
        },
        responses: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/response-or-reference"
          }
        },
        parameters: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/parameter-or-reference"
          }
        },
        examples: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/example-or-reference"
          }
        },
        requestBodies: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/request-body-or-reference"
          }
        },
        headers: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/header-or-reference"
          }
        },
        securitySchemes: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/security-scheme-or-reference"
          }
        },
        links: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/link-or-reference"
          }
        },
        callbacks: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/callbacks-or-reference"
          }
        },
        pathItems: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/path-item-or-reference"
          }
        }
      },
      patternProperties: {
        "^(schemas|responses|parameters|examples|requestBodies|headers|securitySchemes|links|callbacks|pathItems)$": {
          $comment: "Enumerating all of the property names in the regex above is necessary for unevaluatedProperties to work as expected",
          propertyNames: {
            pattern: "^[a-zA-Z0-9._-]+$"
          }
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    paths: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#paths-object",
      type: "object",
      patternProperties: {
        "^/": {
          $ref: "#/$defs/path-item"
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "path-item": {
      $comment: "https://spec.openapis.org/oas/v3.1.0#path-item-object",
      type: "object",
      properties: {
        summary: {
          type: "string"
        },
        description: {
          type: "string"
        },
        servers: {
          type: "array",
          items: {
            $ref: "#/$defs/server"
          }
        },
        parameters: {
          type: "array",
          items: {
            $ref: "#/$defs/parameter-or-reference"
          }
        },
        get: {
          $ref: "#/$defs/operation"
        },
        put: {
          $ref: "#/$defs/operation"
        },
        post: {
          $ref: "#/$defs/operation"
        },
        delete: {
          $ref: "#/$defs/operation"
        },
        options: {
          $ref: "#/$defs/operation"
        },
        head: {
          $ref: "#/$defs/operation"
        },
        patch: {
          $ref: "#/$defs/operation"
        },
        trace: {
          $ref: "#/$defs/operation"
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "path-item-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/path-item"
      }
    },
    operation: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#operation-object",
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: {
            type: "string"
          }
        },
        summary: {
          type: "string"
        },
        description: {
          type: "string"
        },
        externalDocs: {
          $ref: "#/$defs/external-documentation"
        },
        operationId: {
          type: "string"
        },
        parameters: {
          type: "array",
          items: {
            $ref: "#/$defs/parameter-or-reference"
          }
        },
        requestBody: {
          $ref: "#/$defs/request-body-or-reference"
        },
        responses: {
          $ref: "#/$defs/responses"
        },
        callbacks: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/callbacks-or-reference"
          }
        },
        deprecated: {
          default: false,
          type: "boolean"
        },
        security: {
          type: "array",
          items: {
            $ref: "#/$defs/security-requirement"
          }
        },
        servers: {
          type: "array",
          items: {
            $ref: "#/$defs/server"
          }
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "external-documentation": {
      $comment: "https://spec.openapis.org/oas/v3.1.0#external-documentation-object",
      type: "object",
      properties: {
        description: {
          type: "string"
        },
        url: {
          type: "string",
          format: "uri"
        }
      },
      required: [
        "url"
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    parameter: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#parameter-object",
      type: "object",
      properties: {
        name: {
          type: "string"
        },
        in: {
          enum: [
            "query",
            "header",
            "path",
            "cookie"
          ]
        },
        description: {
          type: "string"
        },
        required: {
          default: false,
          type: "boolean"
        },
        deprecated: {
          default: false,
          type: "boolean"
        },
        schema: {
          $dynamicRef: "#meta"
        },
        content: {
          $ref: "#/$defs/content",
          minProperties: 1,
          maxProperties: 1
        }
      },
      required: [
        "name",
        "in"
      ],
      oneOf: [
        {
          required: [
            "schema"
          ]
        },
        {
          required: [
            "content"
          ]
        }
      ],
      if: {
        properties: {
          in: {
            const: "query"
          }
        },
        required: [
          "in"
        ]
      },
      then: {
        properties: {
          allowEmptyValue: {
            default: false,
            type: "boolean"
          }
        }
      },
      dependentSchemas: {
        schema: {
          properties: {
            style: {
              type: "string"
            },
            explode: {
              type: "boolean"
            }
          },
          allOf: [
            {
              $ref: "#/$defs/examples"
            },
            {
              $ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-path"
            },
            {
              $ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-header"
            },
            {
              $ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-query"
            },
            {
              $ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-cookie"
            },
            {
              $ref: "#/$defs/styles-for-form"
            }
          ],
          $defs: {
            "styles-for-path": {
              if: {
                properties: {
                  in: {
                    const: "path"
                  }
                },
                required: [
                  "in"
                ]
              },
              then: {
                properties: {
                  style: {
                    default: "simple",
                    enum: [
                      "matrix",
                      "label",
                      "simple"
                    ]
                  },
                  required: {
                    const: true
                  }
                },
                required: [
                  "required"
                ]
              }
            },
            "styles-for-header": {
              if: {
                properties: {
                  in: {
                    const: "header"
                  }
                },
                required: [
                  "in"
                ]
              },
              then: {
                properties: {
                  style: {
                    default: "simple",
                    const: "simple"
                  }
                }
              }
            },
            "styles-for-query": {
              if: {
                properties: {
                  in: {
                    const: "query"
                  }
                },
                required: [
                  "in"
                ]
              },
              then: {
                properties: {
                  style: {
                    default: "form",
                    enum: [
                      "form",
                      "spaceDelimited",
                      "pipeDelimited",
                      "deepObject"
                    ]
                  },
                  allowReserved: {
                    default: false,
                    type: "boolean"
                  }
                }
              }
            },
            "styles-for-cookie": {
              if: {
                properties: {
                  in: {
                    const: "cookie"
                  }
                },
                required: [
                  "in"
                ]
              },
              then: {
                properties: {
                  style: {
                    default: "form",
                    const: "form"
                  }
                }
              }
            }
          }
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "parameter-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/parameter"
      }
    },
    "request-body": {
      $comment: "https://spec.openapis.org/oas/v3.1.0#request-body-object",
      type: "object",
      properties: {
        description: {
          type: "string"
        },
        content: {
          $ref: "#/$defs/content"
        },
        required: {
          default: false,
          type: "boolean"
        }
      },
      required: [
        "content"
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "request-body-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/request-body"
      }
    },
    content: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#fixed-fields-10",
      type: "object",
      additionalProperties: {
        $ref: "#/$defs/media-type"
      },
      propertyNames: {
        format: "media-range"
      }
    },
    "media-type": {
      $comment: "https://spec.openapis.org/oas/v3.1.0#media-type-object",
      type: "object",
      properties: {
        schema: {
          $dynamicRef: "#meta"
        },
        encoding: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/encoding"
          }
        }
      },
      allOf: [
        {
          $ref: "#/$defs/specification-extensions"
        },
        {
          $ref: "#/$defs/examples"
        }
      ],
      unevaluatedProperties: false
    },
    encoding: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#encoding-object",
      type: "object",
      properties: {
        contentType: {
          type: "string",
          format: "media-range"
        },
        headers: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/header-or-reference"
          }
        },
        style: {
          default: "form",
          enum: [
            "form",
            "spaceDelimited",
            "pipeDelimited",
            "deepObject"
          ]
        },
        explode: {
          type: "boolean"
        },
        allowReserved: {
          default: false,
          type: "boolean"
        }
      },
      allOf: [
        {
          $ref: "#/$defs/specification-extensions"
        },
        {
          $ref: "#/$defs/styles-for-form"
        }
      ],
      unevaluatedProperties: false
    },
    responses: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#responses-object",
      type: "object",
      properties: {
        default: {
          $ref: "#/$defs/response-or-reference"
        }
      },
      patternProperties: {
        "^[1-5](?:[0-9]{2}|XX)$": {
          $ref: "#/$defs/response-or-reference"
        }
      },
      minProperties: 1,
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false,
      if: {
        $comment: "either default, or at least one response code property must exist",
        patternProperties: {
          "^[1-5](?:[0-9]{2}|XX)$": false
        }
      },
      then: {
        required: [
          "default"
        ]
      }
    },
    response: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#response-object",
      type: "object",
      properties: {
        description: {
          type: "string"
        },
        headers: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/header-or-reference"
          }
        },
        content: {
          $ref: "#/$defs/content"
        },
        links: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/link-or-reference"
          }
        }
      },
      required: [
        "description"
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "response-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/response"
      }
    },
    callbacks: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#callback-object",
      type: "object",
      $ref: "#/$defs/specification-extensions",
      additionalProperties: {
        $ref: "#/$defs/path-item-or-reference"
      }
    },
    "callbacks-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/callbacks"
      }
    },
    example: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#example-object",
      type: "object",
      properties: {
        summary: {
          type: "string"
        },
        description: {
          type: "string"
        },
        value: true,
        externalValue: {
          type: "string",
          format: "uri"
        }
      },
      not: {
        required: [
          "value",
          "externalValue"
        ]
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "example-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/example"
      }
    },
    link: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#link-object",
      type: "object",
      properties: {
        operationRef: {
          type: "string",
          format: "uri-reference"
        },
        operationId: {
          type: "string"
        },
        parameters: {
          $ref: "#/$defs/map-of-strings"
        },
        requestBody: true,
        description: {
          type: "string"
        },
        body: {
          $ref: "#/$defs/server"
        }
      },
      oneOf: [
        {
          required: [
            "operationRef"
          ]
        },
        {
          required: [
            "operationId"
          ]
        }
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "link-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/link"
      }
    },
    header: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#header-object",
      type: "object",
      properties: {
        description: {
          type: "string"
        },
        required: {
          default: false,
          type: "boolean"
        },
        deprecated: {
          default: false,
          type: "boolean"
        },
        schema: {
          type: [
            "object",
            "boolean"
          ]
        },
        content: {
          $ref: "#/$defs/content",
          minProperties: 1,
          maxProperties: 1
        }
      },
      oneOf: [
        {
          required: [
            "schema"
          ]
        },
        {
          required: [
            "content"
          ]
        }
      ],
      dependentSchemas: {
        schema: {
          properties: {
            style: {
              default: "simple",
              const: "simple"
            },
            explode: {
              default: false,
              type: "boolean"
            }
          },
          $ref: "#/$defs/examples"
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "header-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/header"
      }
    },
    tag: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#tag-object",
      type: "object",
      properties: {
        name: {
          type: "string"
        },
        description: {
          type: "string"
        },
        externalDocs: {
          $ref: "#/$defs/external-documentation"
        }
      },
      required: [
        "name"
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    reference: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#reference-object",
      type: "object",
      properties: {
        $ref: {
          type: "string",
          format: "uri-reference"
        },
        summary: {
          type: "string"
        },
        description: {
          type: "string"
        }
      }
    },
    schema: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#schema-object",
      $dynamicAnchor: "meta",
      type: [
        "object",
        "boolean"
      ]
    },
    "security-scheme": {
      $comment: "https://spec.openapis.org/oas/v3.1.0#security-scheme-object",
      type: "object",
      properties: {
        type: {
          enum: [
            "apiKey",
            "http",
            "mutualTLS",
            "oauth2",
            "openIdConnect"
          ]
        },
        description: {
          type: "string"
        }
      },
      required: [
        "type"
      ],
      allOf: [
        {
          $ref: "#/$defs/specification-extensions"
        },
        {
          $ref: "#/$defs/security-scheme/$defs/type-apikey"
        },
        {
          $ref: "#/$defs/security-scheme/$defs/type-http"
        },
        {
          $ref: "#/$defs/security-scheme/$defs/type-http-bearer"
        },
        {
          $ref: "#/$defs/security-scheme/$defs/type-oauth2"
        },
        {
          $ref: "#/$defs/security-scheme/$defs/type-oidc"
        }
      ],
      unevaluatedProperties: false,
      $defs: {
        "type-apikey": {
          if: {
            properties: {
              type: {
                const: "apiKey"
              }
            },
            required: [
              "type"
            ]
          },
          then: {
            properties: {
              name: {
                type: "string"
              },
              in: {
                enum: [
                  "query",
                  "header",
                  "cookie"
                ]
              }
            },
            required: [
              "name",
              "in"
            ]
          }
        },
        "type-http": {
          if: {
            properties: {
              type: {
                const: "http"
              }
            },
            required: [
              "type"
            ]
          },
          then: {
            properties: {
              scheme: {
                type: "string"
              }
            },
            required: [
              "scheme"
            ]
          }
        },
        "type-http-bearer": {
          if: {
            properties: {
              type: {
                const: "http"
              },
              scheme: {
                type: "string",
                pattern: "^[Bb][Ee][Aa][Rr][Ee][Rr]$"
              }
            },
            required: [
              "type",
              "scheme"
            ]
          },
          then: {
            properties: {
              bearerFormat: {
                type: "string"
              }
            }
          }
        },
        "type-oauth2": {
          if: {
            properties: {
              type: {
                const: "oauth2"
              }
            },
            required: [
              "type"
            ]
          },
          then: {
            properties: {
              flows: {
                $ref: "#/$defs/oauth-flows"
              }
            },
            required: [
              "flows"
            ]
          }
        },
        "type-oidc": {
          if: {
            properties: {
              type: {
                const: "openIdConnect"
              }
            },
            required: [
              "type"
            ]
          },
          then: {
            properties: {
              openIdConnectUrl: {
                type: "string",
                format: "uri"
              }
            },
            required: [
              "openIdConnectUrl"
            ]
          }
        }
      }
    },
    "security-scheme-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/security-scheme"
      }
    },
    "oauth-flows": {
      type: "object",
      properties: {
        implicit: {
          $ref: "#/$defs/oauth-flows/$defs/implicit"
        },
        password: {
          $ref: "#/$defs/oauth-flows/$defs/password"
        },
        clientCredentials: {
          $ref: "#/$defs/oauth-flows/$defs/client-credentials"
        },
        authorizationCode: {
          $ref: "#/$defs/oauth-flows/$defs/authorization-code"
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false,
      $defs: {
        implicit: {
          type: "object",
          properties: {
            authorizationUrl: {
              type: "string",
              format: "uri"
            },
            refreshUrl: {
              type: "string",
              format: "uri"
            },
            scopes: {
              $ref: "#/$defs/map-of-strings"
            }
          },
          required: [
            "authorizationUrl",
            "scopes"
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        password: {
          type: "object",
          properties: {
            tokenUrl: {
              type: "string",
              format: "uri"
            },
            refreshUrl: {
              type: "string",
              format: "uri"
            },
            scopes: {
              $ref: "#/$defs/map-of-strings"
            }
          },
          required: [
            "tokenUrl",
            "scopes"
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        "client-credentials": {
          type: "object",
          properties: {
            tokenUrl: {
              type: "string",
              format: "uri"
            },
            refreshUrl: {
              type: "string",
              format: "uri"
            },
            scopes: {
              $ref: "#/$defs/map-of-strings"
            }
          },
          required: [
            "tokenUrl",
            "scopes"
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        "authorization-code": {
          type: "object",
          properties: {
            authorizationUrl: {
              type: "string",
              format: "uri"
            },
            tokenUrl: {
              type: "string",
              format: "uri"
            },
            refreshUrl: {
              type: "string",
              format: "uri"
            },
            scopes: {
              $ref: "#/$defs/map-of-strings"
            }
          },
          required: [
            "authorizationUrl",
            "tokenUrl",
            "scopes"
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        }
      }
    },
    "security-requirement": {
      $comment: "https://spec.openapis.org/oas/v3.1.0#security-requirement-object",
      type: "object",
      additionalProperties: {
        type: "array",
        items: {
          type: "string"
        }
      }
    },
    "specification-extensions": {
      $comment: "https://spec.openapis.org/oas/v3.1.0#specification-extensions",
      patternProperties: {
        "^x-": true
      }
    },
    examples: {
      properties: {
        example: true,
        examples: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/example-or-reference"
          }
        }
      }
    },
    "map-of-strings": {
      type: "object",
      additionalProperties: {
        type: "string"
      }
    },
    "styles-for-form": {
      if: {
        properties: {
          style: {
            const: "form"
          }
        },
        required: [
          "style"
        ]
      },
      then: {
        properties: {
          explode: {
            default: true
          }
        }
      },
      else: {
        properties: {
          explode: {
            default: false
          }
        }
      }
    }
  }
};

// src/schemas/v3.1/schema.json
var schema_default3 = {
  $id: "https://spec.openapis.org/oas/3.1/schema/2022-10-07",
  $schema: "https://json-schema.org/draft/2020-12/schema",
  description: "The description of OpenAPI v3.1.x documents without schema validation, as defined by https://spec.openapis.org/oas/v3.1.0",
  type: "object",
  properties: {
    openapi: {
      type: "string",
      pattern: "^3\\.1\\.\\d+(-.+)?$"
    },
    info: {
      $ref: "#/$defs/info"
    },
    jsonSchemaDialect: {
      type: "string",
      format: "uri",
      default: "https://spec.openapis.org/oas/3.1/dialect/base"
    },
    servers: {
      type: "array",
      items: {
        $ref: "#/$defs/server"
      },
      default: [
        {
          url: "/"
        }
      ]
    },
    paths: {
      $ref: "#/$defs/paths"
    },
    webhooks: {
      type: "object",
      additionalProperties: {
        $ref: "#/$defs/path-item-or-reference"
      }
    },
    components: {
      $ref: "#/$defs/components"
    },
    security: {
      type: "array",
      items: {
        $ref: "#/$defs/security-requirement"
      }
    },
    tags: {
      type: "array",
      items: {
        $ref: "#/$defs/tag"
      }
    },
    externalDocs: {
      $ref: "#/$defs/external-documentation"
    }
  },
  required: [
    "openapi",
    "info"
  ],
  anyOf: [
    {
      required: [
        "paths"
      ]
    },
    {
      required: [
        "components"
      ]
    },
    {
      required: [
        "webhooks"
      ]
    }
  ],
  $ref: "#/$defs/specification-extensions",
  unevaluatedProperties: false,
  $defs: {
    info: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#info-object",
      type: "object",
      properties: {
        title: {
          type: "string"
        },
        summary: {
          type: "string"
        },
        description: {
          type: "string"
        },
        termsOfService: {
          type: "string",
          format: "uri"
        },
        contact: {
          $ref: "#/$defs/contact"
        },
        license: {
          $ref: "#/$defs/license"
        },
        version: {
          type: "string"
        }
      },
      required: [
        "title",
        "version"
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    contact: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#contact-object",
      type: "object",
      properties: {
        name: {
          type: "string"
        },
        url: {
          type: "string",
          format: "uri"
        },
        email: {
          type: "string",
          format: "email"
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    license: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#license-object",
      type: "object",
      properties: {
        name: {
          type: "string"
        },
        identifier: {
          type: "string"
        },
        url: {
          type: "string",
          format: "uri"
        }
      },
      required: [
        "name"
      ],
      dependentSchemas: {
        identifier: {
          not: {
            required: [
              "url"
            ]
          }
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    server: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#server-object",
      type: "object",
      properties: {
        url: {
          type: "string",
          format: "uri-reference"
        },
        description: {
          type: "string"
        },
        variables: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/server-variable"
          }
        }
      },
      required: [
        "url"
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "server-variable": {
      $comment: "https://spec.openapis.org/oas/v3.1.0#server-variable-object",
      type: "object",
      properties: {
        enum: {
          type: "array",
          items: {
            type: "string"
          },
          minItems: 1
        },
        default: {
          type: "string"
        },
        description: {
          type: "string"
        }
      },
      required: [
        "default"
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    components: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#components-object",
      type: "object",
      properties: {
        schemas: {
          type: "object",
          additionalProperties: {
            $dynamicRef: "#meta"
          }
        },
        responses: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/response-or-reference"
          }
        },
        parameters: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/parameter-or-reference"
          }
        },
        examples: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/example-or-reference"
          }
        },
        requestBodies: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/request-body-or-reference"
          }
        },
        headers: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/header-or-reference"
          }
        },
        securitySchemes: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/security-scheme-or-reference"
          }
        },
        links: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/link-or-reference"
          }
        },
        callbacks: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/callbacks-or-reference"
          }
        },
        pathItems: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/path-item-or-reference"
          }
        }
      },
      patternProperties: {
        "^(schemas|responses|parameters|examples|requestBodies|headers|securitySchemes|links|callbacks|pathItems)$": {
          $comment: "Enumerating all of the property names in the regex above is necessary for unevaluatedProperties to work as expected",
          propertyNames: {
            pattern: "^[a-zA-Z0-9._-]+$"
          }
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    paths: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#paths-object",
      type: "object",
      patternProperties: {
        "^/": {
          $ref: "#/$defs/path-item"
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "path-item": {
      $comment: "https://spec.openapis.org/oas/v3.1.0#path-item-object",
      type: "object",
      properties: {
        summary: {
          type: "string"
        },
        description: {
          type: "string"
        },
        servers: {
          type: "array",
          items: {
            $ref: "#/$defs/server"
          }
        },
        parameters: {
          type: "array",
          items: {
            $ref: "#/$defs/parameter-or-reference"
          }
        },
        get: {
          $ref: "#/$defs/operation"
        },
        put: {
          $ref: "#/$defs/operation"
        },
        post: {
          $ref: "#/$defs/operation"
        },
        delete: {
          $ref: "#/$defs/operation"
        },
        options: {
          $ref: "#/$defs/operation"
        },
        head: {
          $ref: "#/$defs/operation"
        },
        patch: {
          $ref: "#/$defs/operation"
        },
        trace: {
          $ref: "#/$defs/operation"
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "path-item-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/path-item"
      }
    },
    operation: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#operation-object",
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: {
            type: "string"
          }
        },
        summary: {
          type: "string"
        },
        description: {
          type: "string"
        },
        externalDocs: {
          $ref: "#/$defs/external-documentation"
        },
        operationId: {
          type: "string"
        },
        parameters: {
          type: "array",
          items: {
            $ref: "#/$defs/parameter-or-reference"
          }
        },
        requestBody: {
          $ref: "#/$defs/request-body-or-reference"
        },
        responses: {
          $ref: "#/$defs/responses"
        },
        callbacks: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/callbacks-or-reference"
          }
        },
        deprecated: {
          default: false,
          type: "boolean"
        },
        security: {
          type: "array",
          items: {
            $ref: "#/$defs/security-requirement"
          }
        },
        servers: {
          type: "array",
          items: {
            $ref: "#/$defs/server"
          }
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "external-documentation": {
      $comment: "https://spec.openapis.org/oas/v3.1.0#external-documentation-object",
      type: "object",
      properties: {
        description: {
          type: "string"
        },
        url: {
          type: "string",
          format: "uri"
        }
      },
      required: [
        "url"
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    parameter: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#parameter-object",
      type: "object",
      properties: {
        name: {
          type: "string"
        },
        in: {
          enum: [
            "query",
            "header",
            "path",
            "cookie"
          ]
        },
        description: {
          type: "string"
        },
        required: {
          default: false,
          type: "boolean"
        },
        deprecated: {
          default: false,
          type: "boolean"
        },
        schema: {
          $dynamicRef: "#meta"
        },
        content: {
          $ref: "#/$defs/content",
          minProperties: 1,
          maxProperties: 1
        }
      },
      required: [
        "name",
        "in"
      ],
      oneOf: [
        {
          required: [
            "schema"
          ]
        },
        {
          required: [
            "content"
          ]
        }
      ],
      if: {
        properties: {
          in: {
            const: "query"
          }
        },
        required: [
          "in"
        ]
      },
      then: {
        properties: {
          allowEmptyValue: {
            default: false,
            type: "boolean"
          }
        }
      },
      dependentSchemas: {
        schema: {
          properties: {
            style: {
              type: "string"
            },
            explode: {
              type: "boolean"
            }
          },
          allOf: [
            {
              $ref: "#/$defs/examples"
            },
            {
              $ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-path"
            },
            {
              $ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-header"
            },
            {
              $ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-query"
            },
            {
              $ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-cookie"
            },
            {
              $ref: "#/$defs/styles-for-form"
            }
          ],
          $defs: {
            "styles-for-path": {
              if: {
                properties: {
                  in: {
                    const: "path"
                  }
                },
                required: [
                  "in"
                ]
              },
              then: {
                properties: {
                  style: {
                    default: "simple",
                    enum: [
                      "matrix",
                      "label",
                      "simple"
                    ]
                  },
                  required: {
                    const: true
                  }
                },
                required: [
                  "required"
                ]
              }
            },
            "styles-for-header": {
              if: {
                properties: {
                  in: {
                    const: "header"
                  }
                },
                required: [
                  "in"
                ]
              },
              then: {
                properties: {
                  style: {
                    default: "simple",
                    const: "simple"
                  }
                }
              }
            },
            "styles-for-query": {
              if: {
                properties: {
                  in: {
                    const: "query"
                  }
                },
                required: [
                  "in"
                ]
              },
              then: {
                properties: {
                  style: {
                    default: "form",
                    enum: [
                      "form",
                      "spaceDelimited",
                      "pipeDelimited",
                      "deepObject"
                    ]
                  },
                  allowReserved: {
                    default: false,
                    type: "boolean"
                  }
                }
              }
            },
            "styles-for-cookie": {
              if: {
                properties: {
                  in: {
                    const: "cookie"
                  }
                },
                required: [
                  "in"
                ]
              },
              then: {
                properties: {
                  style: {
                    default: "form",
                    const: "form"
                  }
                }
              }
            }
          }
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "parameter-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/parameter"
      }
    },
    "request-body": {
      $comment: "https://spec.openapis.org/oas/v3.1.0#request-body-object",
      type: "object",
      properties: {
        description: {
          type: "string"
        },
        content: {
          $ref: "#/$defs/content"
        },
        required: {
          default: false,
          type: "boolean"
        }
      },
      required: [
        "content"
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "request-body-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/request-body"
      }
    },
    content: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#fixed-fields-10",
      type: "object",
      additionalProperties: {
        $ref: "#/$defs/media-type"
      },
      propertyNames: {
        format: "media-range"
      }
    },
    "media-type": {
      $comment: "https://spec.openapis.org/oas/v3.1.0#media-type-object",
      type: "object",
      properties: {
        schema: {
          $dynamicRef: "#meta"
        },
        encoding: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/encoding"
          }
        }
      },
      allOf: [
        {
          $ref: "#/$defs/specification-extensions"
        },
        {
          $ref: "#/$defs/examples"
        }
      ],
      unevaluatedProperties: false
    },
    encoding: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#encoding-object",
      type: "object",
      properties: {
        contentType: {
          type: "string",
          format: "media-range"
        },
        headers: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/header-or-reference"
          }
        },
        style: {
          default: "form",
          enum: [
            "form",
            "spaceDelimited",
            "pipeDelimited",
            "deepObject"
          ]
        },
        explode: {
          type: "boolean"
        },
        allowReserved: {
          default: false,
          type: "boolean"
        }
      },
      allOf: [
        {
          $ref: "#/$defs/specification-extensions"
        },
        {
          $ref: "#/$defs/styles-for-form"
        }
      ],
      unevaluatedProperties: false
    },
    responses: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#responses-object",
      type: "object",
      properties: {
        default: {
          $ref: "#/$defs/response-or-reference"
        }
      },
      patternProperties: {
        "^[1-5](?:[0-9]{2}|XX)$": {
          $ref: "#/$defs/response-or-reference"
        }
      },
      minProperties: 1,
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false,
      if: {
        $comment: "either default, or at least one response code property must exist",
        patternProperties: {
          "^[1-5](?:[0-9]{2}|XX)$": false
        }
      },
      then: {
        required: ["default"]
      }
    },
    response: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#response-object",
      type: "object",
      properties: {
        description: {
          type: "string"
        },
        headers: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/header-or-reference"
          }
        },
        content: {
          $ref: "#/$defs/content"
        },
        links: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/link-or-reference"
          }
        }
      },
      required: [
        "description"
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "response-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/response"
      }
    },
    callbacks: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#callback-object",
      type: "object",
      $ref: "#/$defs/specification-extensions",
      additionalProperties: {
        $ref: "#/$defs/path-item-or-reference"
      }
    },
    "callbacks-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/callbacks"
      }
    },
    example: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#example-object",
      type: "object",
      properties: {
        summary: {
          type: "string"
        },
        description: {
          type: "string"
        },
        value: true,
        externalValue: {
          type: "string",
          format: "uri"
        }
      },
      not: {
        required: [
          "value",
          "externalValue"
        ]
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "example-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/example"
      }
    },
    link: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#link-object",
      type: "object",
      properties: {
        operationRef: {
          type: "string",
          format: "uri-reference"
        },
        operationId: {
          type: "string"
        },
        parameters: {
          $ref: "#/$defs/map-of-strings"
        },
        requestBody: true,
        description: {
          type: "string"
        },
        body: {
          $ref: "#/$defs/server"
        }
      },
      oneOf: [
        {
          required: [
            "operationRef"
          ]
        },
        {
          required: [
            "operationId"
          ]
        }
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "link-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/link"
      }
    },
    header: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#header-object",
      type: "object",
      properties: {
        description: {
          type: "string"
        },
        required: {
          default: false,
          type: "boolean"
        },
        deprecated: {
          default: false,
          type: "boolean"
        },
        schema: {
          $dynamicRef: "#meta"
        },
        content: {
          $ref: "#/$defs/content",
          minProperties: 1,
          maxProperties: 1
        }
      },
      oneOf: [
        {
          required: [
            "schema"
          ]
        },
        {
          required: [
            "content"
          ]
        }
      ],
      dependentSchemas: {
        schema: {
          properties: {
            style: {
              default: "simple",
              const: "simple"
            },
            explode: {
              default: false,
              type: "boolean"
            }
          },
          $ref: "#/$defs/examples"
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    "header-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/header"
      }
    },
    tag: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#tag-object",
      type: "object",
      properties: {
        name: {
          type: "string"
        },
        description: {
          type: "string"
        },
        externalDocs: {
          $ref: "#/$defs/external-documentation"
        }
      },
      required: [
        "name"
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false
    },
    reference: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#reference-object",
      type: "object",
      properties: {
        $ref: {
          type: "string",
          format: "uri-reference"
        },
        summary: {
          type: "string"
        },
        description: {
          type: "string"
        }
      }
    },
    schema: {
      $comment: "https://spec.openapis.org/oas/v3.1.0#schema-object",
      $dynamicAnchor: "meta",
      type: [
        "object",
        "boolean"
      ]
    },
    "security-scheme": {
      $comment: "https://spec.openapis.org/oas/v3.1.0#security-scheme-object",
      type: "object",
      properties: {
        type: {
          enum: [
            "apiKey",
            "http",
            "mutualTLS",
            "oauth2",
            "openIdConnect"
          ]
        },
        description: {
          type: "string"
        }
      },
      required: [
        "type"
      ],
      allOf: [
        {
          $ref: "#/$defs/specification-extensions"
        },
        {
          $ref: "#/$defs/security-scheme/$defs/type-apikey"
        },
        {
          $ref: "#/$defs/security-scheme/$defs/type-http"
        },
        {
          $ref: "#/$defs/security-scheme/$defs/type-http-bearer"
        },
        {
          $ref: "#/$defs/security-scheme/$defs/type-oauth2"
        },
        {
          $ref: "#/$defs/security-scheme/$defs/type-oidc"
        }
      ],
      unevaluatedProperties: false,
      $defs: {
        "type-apikey": {
          if: {
            properties: {
              type: {
                const: "apiKey"
              }
            },
            required: [
              "type"
            ]
          },
          then: {
            properties: {
              name: {
                type: "string"
              },
              in: {
                enum: [
                  "query",
                  "header",
                  "cookie"
                ]
              }
            },
            required: [
              "name",
              "in"
            ]
          }
        },
        "type-http": {
          if: {
            properties: {
              type: {
                const: "http"
              }
            },
            required: [
              "type"
            ]
          },
          then: {
            properties: {
              scheme: {
                type: "string"
              }
            },
            required: [
              "scheme"
            ]
          }
        },
        "type-http-bearer": {
          if: {
            properties: {
              type: {
                const: "http"
              },
              scheme: {
                type: "string",
                pattern: "^[Bb][Ee][Aa][Rr][Ee][Rr]$"
              }
            },
            required: [
              "type",
              "scheme"
            ]
          },
          then: {
            properties: {
              bearerFormat: {
                type: "string"
              }
            }
          }
        },
        "type-oauth2": {
          if: {
            properties: {
              type: {
                const: "oauth2"
              }
            },
            required: [
              "type"
            ]
          },
          then: {
            properties: {
              flows: {
                $ref: "#/$defs/oauth-flows"
              }
            },
            required: [
              "flows"
            ]
          }
        },
        "type-oidc": {
          if: {
            properties: {
              type: {
                const: "openIdConnect"
              }
            },
            required: [
              "type"
            ]
          },
          then: {
            properties: {
              openIdConnectUrl: {
                type: "string",
                format: "uri"
              }
            },
            required: [
              "openIdConnectUrl"
            ]
          }
        }
      }
    },
    "security-scheme-or-reference": {
      if: {
        type: "object",
        required: [
          "$ref"
        ]
      },
      then: {
        $ref: "#/$defs/reference"
      },
      else: {
        $ref: "#/$defs/security-scheme"
      }
    },
    "oauth-flows": {
      type: "object",
      properties: {
        implicit: {
          $ref: "#/$defs/oauth-flows/$defs/implicit"
        },
        password: {
          $ref: "#/$defs/oauth-flows/$defs/password"
        },
        clientCredentials: {
          $ref: "#/$defs/oauth-flows/$defs/client-credentials"
        },
        authorizationCode: {
          $ref: "#/$defs/oauth-flows/$defs/authorization-code"
        }
      },
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false,
      $defs: {
        implicit: {
          type: "object",
          properties: {
            authorizationUrl: {
              type: "string",
              format: "uri"
            },
            refreshUrl: {
              type: "string",
              format: "uri"
            },
            scopes: {
              $ref: "#/$defs/map-of-strings"
            }
          },
          required: [
            "authorizationUrl",
            "scopes"
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        password: {
          type: "object",
          properties: {
            tokenUrl: {
              type: "string",
              format: "uri"
            },
            refreshUrl: {
              type: "string",
              format: "uri"
            },
            scopes: {
              $ref: "#/$defs/map-of-strings"
            }
          },
          required: [
            "tokenUrl",
            "scopes"
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        "client-credentials": {
          type: "object",
          properties: {
            tokenUrl: {
              type: "string",
              format: "uri"
            },
            refreshUrl: {
              type: "string",
              format: "uri"
            },
            scopes: {
              $ref: "#/$defs/map-of-strings"
            }
          },
          required: [
            "tokenUrl",
            "scopes"
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        "authorization-code": {
          type: "object",
          properties: {
            authorizationUrl: {
              type: "string",
              format: "uri"
            },
            tokenUrl: {
              type: "string",
              format: "uri"
            },
            refreshUrl: {
              type: "string",
              format: "uri"
            },
            scopes: {
              $ref: "#/$defs/map-of-strings"
            }
          },
          required: [
            "authorizationUrl",
            "tokenUrl",
            "scopes"
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        }
      }
    },
    "security-requirement": {
      $comment: "https://spec.openapis.org/oas/v3.1.0#security-requirement-object",
      type: "object",
      additionalProperties: {
        type: "array",
        items: {
          type: "string"
        }
      }
    },
    "specification-extensions": {
      $comment: "https://spec.openapis.org/oas/v3.1.0#specification-extensions",
      patternProperties: {
        "^x-": true
      }
    },
    examples: {
      properties: {
        example: true,
        examples: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/example-or-reference"
          }
        }
      }
    },
    "map-of-strings": {
      type: "object",
      additionalProperties: {
        type: "string"
      }
    },
    "styles-for-form": {
      if: {
        properties: {
          style: {
            const: "form"
          }
        },
        required: [
          "style"
        ]
      },
      then: {
        properties: {
          explode: {
            default: true
          }
        }
      },
      else: {
        properties: {
          explode: {
            default: false
          }
        }
      }
    }
  }
};

// src/index.ts
var openapi = {
  v1: apiDeclaration_default,
  v2: schema_default,
  v3: schema_default2,
  v31: schema_default3,
  v31legacy: legacy_schema_default
};

//# sourceMappingURL=index.mjs.map
// EXTERNAL MODULE: ./node_modules/ajv-draft-04/dist/index.js
var dist = __nccwpck_require__(905);
// EXTERNAL MODULE: ./node_modules/ajv/dist/2020.js
var _2020 = __nccwpck_require__(2210);
;// CONCATENATED MODULE: ./node_modules/@readme/openapi-parser/dist/index.js


// src/index.ts


// src/util.ts


// src/lib/index.ts
var pathParameterTemplateRegExp = /\{([^/}]+)}/g;
var supportedHTTPMethods = ["get", "post", "put", "delete", "patch", "options", "head", "trace"];
var swaggerHTTPMethods = ["get", "put", "post", "delete", "options", "head", "patch"];
function getSpecificationName(api) {
  return isSwagger(api) ? "Swagger" : "OpenAPI";
}

// src/repair.ts
function fixServers(server, path) {
  if (server && "url" in server && server.url && server.url.startsWith("/")) {
    try {
      const inUrl = new URL(path);
      server.url = `${inUrl.protocol}//${inUrl.hostname}${server.url}`;
    } catch {
    }
  }
}
function fixOasRelativeServers(schema, filePath) {
  if (!schema || !isOpenAPI(schema) || !filePath || !filePath.startsWith("http:") && !filePath.startsWith("https:")) {
    return;
  }
  if (schema.servers) {
    schema.servers.map((server) => fixServers(server, filePath));
  }
  ["paths", "webhooks"].forEach((component) => {
    if (component in schema) {
      const schemaElement = schema.paths || {};
      Object.keys(schemaElement).forEach((path) => {
        const pathItem = schemaElement[path] || {};
        Object.keys(pathItem).forEach((opItem) => {
          const pathItemElement = pathItem[opItem];
          if (!pathItemElement) {
            return;
          }
          if (opItem === "servers" && Array.isArray(pathItemElement)) {
            pathItemElement.forEach((server) => {
              fixServers(server, filePath);
            });
            return;
          }
          if (supportedHTTPMethods.includes(opItem) && typeof pathItemElement === "object" && "servers" in pathItemElement && Array.isArray(pathItemElement.servers)) {
            pathItemElement.servers.forEach((server) => {
              fixServers(server, filePath);
            });
          }
        });
      });
    }
  });
}

// src/util.ts
function repairSchema(schema, filePath) {
  if (isOpenAPI(schema)) {
    fixOasRelativeServers(schema, filePath);
  }
}
function normalizeArguments(api) {
  return {
    path: typeof api === "string" ? api : "",
    schema: typeof api === "object" ? api : void 0
  };
}
function convertOptionsForParser(options) {
  const parserOptions = (0,lib.getJsonSchemaRefParserDefaultOptions)();
  return {
    ...parserOptions,
    dereference: {
      ...parserOptions.dereference,
      circular: options?.dereference && "circular" in options.dereference ? options.dereference.circular : parserOptions.dereference.circular,
      onCircular: options?.dereference?.onCircular || parserOptions.dereference.onCircular,
      onDereference: options?.dereference?.onDereference || parserOptions.dereference.onDereference,
      // OpenAPI 3.1 allows for `summary` and `description` properties at the same level as a `$ref`
      // pointer to be preserved when that `$ref` pointer is dereferenced. The default behavior of
      // `json-schema-ref-parser` is to discard these properties but this option allows us to
      // override that behavior.
      preservedProperties: ["summary", "description"]
    },
    resolve: {
      ...parserOptions.resolve,
      external: options?.resolve && "external" in options.resolve ? options.resolve.external : parserOptions.resolve.external,
      file: options?.resolve && "file" in options.resolve ? options.resolve.file : parserOptions.resolve.file,
      http: {
        ...typeof parserOptions.resolve.http === "object" ? parserOptions.resolve.http : {},
        timeout: options?.resolve?.http && "timeout" in options.resolve.http ? options.resolve.http.timeout : 5e3
      }
    },
    timeoutMs: options?.timeoutMs
  };
}

// src/validators/schema.ts





// src/lib/hasInvalidPaths.ts
function hasInvalidPaths(api) {
  if (!api.paths || typeof api.paths !== "object" || Array.isArray(api.paths)) {
    return false;
  }
  return Object.keys(api.paths).some((path) => !path.startsWith("/"));
}

// src/lib/reduceAjvErrors.ts
function reduceAjvErrors(errors) {
  const flattened = /* @__PURE__ */ new Map();
  errors.forEach((err) => {
    if (["must have required property '$ref'", "must match exactly one schema in oneOf"].includes(err.message)) {
      return;
    }
    if (!flattened.size) {
      flattened.set(err.instancePath, err);
      return;
    } else if (flattened.has(err.instancePath)) {
      return;
    }
    let shouldRecordError = true;
    flattened.forEach((flat) => {
      if (flat.instancePath.includes(err.instancePath)) {
        shouldRecordError = false;
      }
    });
    if (shouldRecordError) {
      flattened.set(err.instancePath, err);
    }
  });
  if (!flattened.size) {
    return errors;
  }
  return [...flattened.values()];
}

// src/validators/schema.ts
var LARGE_SPEC_ERROR_CAP = 20;
var LARGE_SPEC_SIZE_CAP = 5e6;
function initializeAjv(draft04 = true) {
  const opts = {
    allErrors: true,
    strict: false,
    validateFormats: false
  };
  if (draft04) {
    return new dist(opts);
  }
  return new _2020(opts);
}
function validateSchema(api, options = {}, suppressedInstancePaths = []) {
  if (hasInvalidPaths(api)) {
    return {
      valid: false,
      errors: [
        {
          message: getSpecificationName(api) === "Swagger" ? "Entries in the Swagger `paths` object must begin with a leading slash." : "Entries in the OpenAPI `paths` object must begin with a leading slash."
        }
      ],
      warnings: [],
      additionalErrors: 0,
      specification: getSpecificationName(api)
    };
  }
  let ajv;
  let schema;
  const specificationName = getSpecificationName(api);
  if (isSwagger(api)) {
    schema = openapi.v2;
    ajv = initializeAjv();
  } else if (isOpenAPI32(api)) {
    throw new TypeError("OpenAPI 3.2 is currently unsupported.");
  } else if (isOpenAPI31(api)) {
    schema = openapi.v31legacy;
    const schemaDynamicRef = schema.$defs.schema;
    if ("$dynamicAnchor" in schemaDynamicRef) {
      delete schemaDynamicRef.$dynamicAnchor;
    }
    schema.$defs.components.properties.schemas.additionalProperties = schemaDynamicRef;
    schema.$defs.header.dependentSchemas.schema.properties.schema = schemaDynamicRef;
    schema.$defs["media-type"].properties.schema = schemaDynamicRef;
    schema.$defs.parameter.properties.schema = schemaDynamicRef;
    ajv = initializeAjv(false);
  } else {
    schema = openapi.v3;
    ajv = initializeAjv();
  }
  const isValid = ajv.validate(schema, api);
  if (isValid) {
    return { valid: true, warnings: [], specification: specificationName };
  }
  let additionalErrors = 0;
  let reducedErrors = reduceAjvErrors(ajv.errors).filter((err) => {
    return !suppressedInstancePaths.some((path) => err.instancePath === path || err.instancePath.startsWith(`${path}/`));
  });
  if (!reducedErrors.length) {
    return { valid: true, warnings: [], specification: specificationName };
  }
  if (reducedErrors.length >= LARGE_SPEC_ERROR_CAP) {
    try {
      if (JSON.stringify(api).length >= LARGE_SPEC_SIZE_CAP) {
        additionalErrors = reducedErrors.length - 20;
        reducedErrors = reducedErrors.slice(0, 20);
      }
    } catch {
    }
  }
  try {
    const errors = better_ajv_errors_lib(schema, api, reducedErrors, {
      format: "cli-array",
      colorize: options?.validate?.errors?.colorize || false,
      indent: 2
    });
    return {
      valid: false,
      errors,
      warnings: [],
      additionalErrors,
      specification: specificationName
    };
  } catch (err) {
    return {
      valid: false,
      errors: [{ message: err.message }],
      warnings: [],
      additionalErrors,
      specification: specificationName
    };
  }
}

// src/validators/spec/index.ts
var SpecificationValidator = class {
  errors = [];
  warnings = [];
  /**
   * Instance paths flagged by `runPreSchemaChecks()`. Used to suppress AJV `oneOf` noise that
   * the pre-schema validator has already produced a clearer error or warning for.
   */
  flaggedInstancePaths = [];
  reportError(message) {
    this.errors.push({ message });
  }
  reportWarning(message) {
    this.warnings.push({ message });
  }
  flagInstancePath(path) {
    if (!this.flaggedInstancePaths.includes(path)) {
      this.flaggedInstancePaths.push(path);
    }
  }
};

// src/validators/spec/openapi.ts
var OpenAPISpecificationValidator = class extends SpecificationValidator {
  api;
  rules;
  constructor(api, rules) {
    super();
    this.api = api;
    this.rules = rules;
  }
  runPreSchemaChecks() {
    this.checkSecuritySchemes();
  }
  run() {
    const operationIds = [];
    Object.keys(this.api.paths || {}).forEach((pathName) => {
      const path = this.api.paths[pathName];
      const pathId = `/paths${pathName}`;
      if (path && pathName.startsWith("/")) {
        this.validatePath(path, pathId, operationIds);
      }
    });
    if (isOpenAPI30(this.api)) {
      if (this.api.components) {
        Object.keys(this.api.components).forEach((componentType) => {
          Object.keys(this.api.components[componentType]).forEach((componentName) => {
            if (!/^[a-zA-Z0-9.\-_]+$/.test(componentName)) {
              const componentId = `/components/${componentType}/${componentName}`;
              this.reportError(
                `\`${componentId}\` has an invalid name. Component names should match against: /^[a-zA-Z0-9.-_]+$/`
              );
            }
          });
        });
      }
    }
    if (isOpenAPI31(this.api)) {
      if (!Object.keys(this.api.paths || {}).length && !Object.keys(this.api.webhooks || {}).length && !Object.keys(this.api.components || {}).length) {
        this.reportError(
          "OpenAPI 3.1 definitions must contain at least one entry in either `paths`, `webhooks`, or `components`."
        );
      }
    }
  }
  /**
   * Validates the given path.
   *
   */
  validatePath(path, pathId, operationIds) {
    supportedHTTPMethods.forEach((operationName) => {
      const operation = path[operationName];
      const operationId = `${pathId}/${operationName}`;
      if (operation) {
        const declaredOperationId = operation.operationId;
        if (declaredOperationId) {
          if (!operationIds.includes(declaredOperationId)) {
            operationIds.push(declaredOperationId);
          } else if (this.rules["duplicate-operation-id"] === "warning") {
            this.reportWarning(`The operationId \`${declaredOperationId}\` is duplicated and should be made unique.`);
          } else {
            this.reportError(`The operationId \`${declaredOperationId}\` is duplicated and must be made unique.`);
          }
        }
        this.validateParameters(path, pathId, operation, operationId);
        Object.keys(operation.responses || {}).forEach((responseCode) => {
          const response = operation.responses[responseCode];
          const responseId = `${operationId}/responses/${responseCode}`;
          if (response && !("$ref" in response)) {
            this.validateResponse(response, responseId);
          }
        });
      }
    });
  }
  /**
   * Validates the parameters for the given operation.
   *
   */
  validateParameters(path, pathId, operation, operationId) {
    const pathParams = path.parameters || [];
    const operationParams = operation.parameters || [];
    this.checkForDuplicates(pathParams, pathId);
    this.checkForDuplicates(operationParams, operationId);
    const params = pathParams.reduce((combinedParams, value) => {
      const duplicate = combinedParams.some((param) => {
        if ("$ref" in param || "$ref" in value) {
          return false;
        }
        return param.in === value.in && param.name === value.name;
      });
      if (!duplicate) {
        combinedParams.push(value);
      }
      return combinedParams;
    }, operationParams.slice());
    this.validatePathParameters(params, pathId, operationId);
    this.validateParameterTypes(params, operationId);
  }
  /**
   * Validates path parameters for the given path.
   *
   */
  validatePathParameters(params, pathId, operationId) {
    const placeholders = [...new Set(pathId.match(pathParameterTemplateRegExp) || [])];
    params.filter((param) => "in" in param).filter((param) => param.in === "path").forEach((param) => {
      if (param.required !== true) {
        if (this.rules["non-optional-path-parameters"] === "warning") {
          this.reportWarning(
            `Path parameters should not be optional. Set \`required=true\` for the \`${param.name}\` parameter at \`${operationId}\`.`
          );
        } else {
          this.reportError(
            `Path parameters cannot be optional. Set \`required=true\` for the \`${param.name}\` parameter at \`${operationId}\`.`
          );
        }
      }
      const match = placeholders.indexOf(`{${param.name}}`);
      if (match === -1) {
        const error = `\`${operationId}\` has a path parameter named \`${param.name}\`, but there is no corresponding \`{${param.name}}\` in the path string.`;
        if (this.rules["path-parameters-not-in-path"] === "warning") {
          this.reportWarning(error);
        } else {
          this.reportError(error);
        }
      }
      placeholders.splice(match, 1);
    });
    if (placeholders.length > 0) {
      const list = new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(
        placeholders.map((placeholder) => `\`${placeholder}\``)
      );
      const error = `\`${operationId}\` is missing path parameter(s) for ${list}.`;
      if (this.rules["path-parameters-not-in-parameters"] === "warning") {
        this.reportWarning(error);
      } else {
        this.reportError(error);
      }
    }
  }
  /**
   * Validates data types of parameters for the given operation.
   *
   */
  validateParameterTypes(params, operationId) {
    params.forEach((param) => {
      if ("$ref" in param) {
        return;
      }
      const parameterId = `${operationId}/parameters/${param.name}`;
      if (!param.schema && param.content) {
        this.validateParameterContent(param.content, parameterId);
        return;
      } else if ("$ref" in param.schema) {
        return;
      }
      this.validateSchema(param.schema, parameterId);
    });
  }
  /**
   * Validates parameter content object.
   * Note: The requirement for exactly one media type is already enforced by the OpenAPI JSON schema.
   */
  validateParameterContent(content, parameterId) {
    const mediaTypes = Object.keys(content);
    if (mediaTypes.length !== 1) {
      this.reportError(
        `\`${parameterId}\` must have exactly one media type in \`content\`, but found ${mediaTypes.length}.`
      );
      return;
    }
    const mediaType = mediaTypes[0];
    const contentSchema = content[mediaType].schema;
    if (contentSchema) {
      if ("$ref" in contentSchema) {
        return;
      }
      this.validateSchema(contentSchema, `${parameterId}/content/${mediaType}/schema`);
    }
  }
  /**
   * Validates the given response object.
   *
   */
  validateResponse(response, responseId) {
    Object.keys(response.headers || {}).forEach((headerName) => {
      const header = response.headers[headerName];
      const headerId = `${responseId}/headers/${headerName}`;
      if ("$ref" in header) {
        return;
      }
      if (header.schema) {
        if (!("$ref" in header.schema)) {
          this.validateSchema(header.schema, headerId);
        }
      } else if (header.content) {
        Object.keys(header.content).forEach((mediaType) => {
          if (header.content[mediaType].schema) {
            if (!("$ref" in header.content[mediaType].schema)) {
              this.validateSchema(header.content[mediaType].schema || {}, `${headerId}/content/${mediaType}/schema`);
            }
          }
        });
      }
    });
    if (response.content) {
      Object.keys(response.content).forEach((mediaType) => {
        if (response.content[mediaType].schema) {
          if (!("$ref" in response.content[mediaType].schema)) {
            this.validateSchema(response.content[mediaType].schema || {}, `${responseId}/content/${mediaType}/schema`);
          }
        }
      });
    }
  }
  /**
   * Validates the given Swagger schema object.
   *
   */
  validateSchema(schema, schemaId) {
    if (schema.type === "array" && !schema.items) {
      if (this.rules["array-without-items"] === "warning") {
        this.reportWarning(`\`${schemaId}\` is an array, so it should include an \`items\` schema.`);
      } else {
        this.reportError(`\`${schemaId}\` is an array, so it must include an \`items\` schema.`);
      }
    }
  }
  /**
   * Validates security schemes in `components.securitySchemes` against their declared `type`.
   *
   * AJV uses a `oneOf` schema to validate security schemes, so when a scheme is malformed AJV
   * fails every branch and produces overwhelming, unhelpful errors. This pre-AJV pass surfaces
   * a single targeted error per problem.
   *
   * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#security-scheme-object}
   */
  checkSecuritySchemes() {
    const securitySchemes = this.api.components?.securitySchemes;
    if (!securitySchemes) {
      return;
    }
    const schemeTypeProps = {
      apiKey: {
        required: ["name", "in"],
        foreign: { scheme: "http", bearerFormat: "http", flows: "oauth2", openIdConnectUrl: "openIdConnect" }
      },
      http: {
        required: ["scheme"],
        foreign: { name: "apiKey", in: "apiKey", flows: "oauth2", openIdConnectUrl: "openIdConnect" }
      },
      oauth2: {
        required: ["flows"],
        foreign: {
          name: "apiKey",
          in: "apiKey",
          scheme: "http",
          bearerFormat: "http",
          openIdConnectUrl: "openIdConnect"
        }
      },
      openIdConnect: {
        required: ["openIdConnectUrl"],
        foreign: { name: "apiKey", in: "apiKey", scheme: "http", bearerFormat: "http", flows: "oauth2" }
      },
      mutualTLS: {
        required: [],
        foreign: {
          name: "apiKey",
          in: "apiKey",
          scheme: "http",
          bearerFormat: "http",
          flows: "oauth2",
          openIdConnectUrl: "openIdConnect"
        }
      }
    };
    Object.keys(securitySchemes).forEach((name) => {
      const scheme = securitySchemes[name];
      if ("$ref" in scheme) {
        return;
      }
      const schemeId = `/components/securitySchemes/${name}`;
      const reportIssue = (message) => this.reportSecuritySchemeIssue(message, schemeId);
      if (!("type" in scheme) || !scheme.type) {
        reportIssue(
          `\`${schemeId}\` is missing required property \`type\`. Must be one of: \`apiKey\`, \`http\`, \`oauth2\`, \`openIdConnect\`, \`mutualTLS\`.`
        );
        return;
      }
      const type = scheme.type;
      if (type === "basic") {
        reportIssue(
          `\`${schemeId}\` uses \`type: basic\`, which is a Swagger 2.0 value. In OpenAPI 3.x use \`type: http\` with \`scheme: basic\` instead.`
        );
        return;
      }
      if (!(type in schemeTypeProps)) {
        reportIssue(
          `\`${schemeId}\` has an invalid \`type\`: \`${type}\`. Must be one of: \`apiKey\`, \`http\`, \`oauth2\`, \`openIdConnect\`, \`mutualTLS\`.`
        );
        return;
      }
      const config = schemeTypeProps[type];
      config.required.forEach((prop) => {
        if (!(prop in scheme)) {
          reportIssue(`\`${schemeId}\` (\`type: ${type}\`) is missing required property \`${prop}\`.`);
        }
      });
      Object.entries(config.foreign).forEach(([prop, ownerType]) => {
        if (prop in scheme) {
          reportIssue(
            `\`${schemeId}\` (\`type: ${type}\`) includes \`${prop}\`, which is only valid for \`type: ${ownerType}\` schemes.`
          );
        }
      });
      if (type === "apiKey" && typeof scheme.in === "string") {
        const validIn = ["query", "header", "cookie"];
        if (!validIn.includes(scheme.in)) {
          reportIssue(
            `\`${schemeId}\` has an invalid \`in\` value: \`${scheme.in}\`. Must be one of: \`query\`, \`header\`, \`cookie\`.`
          );
        }
      }
      if (type === "oauth2" && scheme.flows && typeof scheme.flows === "object") {
        if (Object.keys(scheme.flows).length === 0) {
          reportIssue(
            `\`${schemeId}\` has empty \`flows\`. At least one grant type is required: \`implicit\`, \`password\`, \`clientCredentials\`, or \`authorizationCode\`.`
          );
        }
      }
    });
  }
  reportSecuritySchemeIssue(message, schemeId) {
    this.flagInstancePath(schemeId);
    if (this.rules["invalid-security-scheme-properties"] === "warning") {
      this.reportWarning(message);
    } else {
      this.reportError(message);
    }
  }
  /**
   * Checks the given parameter list for duplicates.
   *
   */
  checkForDuplicates(params, schemaId) {
    for (let i = 0; i < params.length - 1; i++) {
      const outer = params[i];
      for (let j = i + 1; j < params.length; j++) {
        const inner = params[j];
        if ("$ref" in outer || "$ref" in inner) {
          continue;
        }
        if (outer.name === inner.name && outer.in === inner.in) {
          const error = `Found multiple \`${outer.in}\` parameters named \`${outer.name}\` in \`${schemaId}\`.`;
          if (this.rules["duplicate-non-request-body-parameters"] === "warning") {
            this.reportWarning(error);
          } else {
            this.reportError(error);
          }
        }
      }
    }
  }
};

// src/validators/spec/swagger.ts
var SwaggerSpecificationValidator = class extends SpecificationValidator {
  api;
  rules;
  constructor(api, rules) {
    super();
    this.api = api;
    this.rules = rules;
  }
  runPreSchemaChecks() {
    this.checkSecurityDefinitions();
  }
  run() {
    const operationIds = [];
    Object.keys(this.api.paths || {}).forEach((pathName) => {
      const path = this.api.paths[pathName];
      const pathId = `/paths${pathName}`;
      if (path && pathName.startsWith("/")) {
        this.validatePath(path, pathId, operationIds);
      }
    });
    Object.keys(this.api.definitions || {}).forEach((definitionName) => {
      const definition = this.api.definitions[definitionName];
      const definitionId = `/definitions/${definitionName}`;
      if (!/^[a-zA-Z0-9.\-_]+$/.test(definitionName)) {
        this.reportError(
          `\`${definitionId}\` has an invalid name. Definition names should match against: /^[a-zA-Z0-9.-_]+$/`
        );
      }
      this.validateRequiredPropertiesExist(definition, definitionId);
    });
  }
  /**
   * Validates the given path.
   *
   */
  validatePath(path, pathId, operationIds) {
    swaggerHTTPMethods.forEach((operationName) => {
      const operation = path[operationName];
      const operationId = `${pathId}/${operationName}`;
      if (operation) {
        const declaredOperationId = operation.operationId;
        if (declaredOperationId) {
          if (!operationIds.includes(declaredOperationId)) {
            operationIds.push(declaredOperationId);
          } else if (this.rules["duplicate-operation-id"] === "warning") {
            this.reportWarning(`The operationId \`${declaredOperationId}\` is duplicated and should be made unique.`);
          } else {
            this.reportError(`The operationId \`${declaredOperationId}\` is duplicated and must be made unique.`);
          }
        }
        this.validateParameters(path, pathId, operation, operationId);
        Object.keys(operation.responses || {}).forEach((responseName) => {
          const response = operation.responses[responseName];
          if ("$ref" in response || !response) {
            return;
          }
          const responseId = `${operationId}/responses/${responseName}`;
          this.validateResponse(responseName, response, responseId);
        });
      }
    });
  }
  /**
   * Validates the parameters for the given operation.
   *
   */
  validateParameters(path, pathId, operation, operationId) {
    const pathParams = (path.parameters || []).filter((param) => !("$ref" in param));
    const operationParams = (operation.parameters || []).filter(
      (param) => !("$ref" in param)
    );
    this.checkForDuplicates(pathParams, pathId);
    this.checkForDuplicates(operationParams, operationId);
    const params = pathParams.reduce((combinedParams, value) => {
      const duplicate = combinedParams.some((param) => {
        if ("$ref" in param || "$ref" in value) {
          return false;
        }
        return param.in === value.in && param.name === value.name;
      });
      if (!duplicate) {
        combinedParams.push(value);
      }
      return combinedParams;
    }, operationParams.slice());
    this.validateBodyParameters(params, operationId);
    this.validatePathParameters(params, pathId, operationId);
    this.validateParameterTypes(params, operation, operationId);
  }
  /**
   * Validates body and formData parameters for the given operation.
   *
   */
  validateBodyParameters(params, operationId) {
    const bodyParams = params.filter((param) => param.in === "body");
    const formParams = params.filter((param) => param.in === "formData");
    if (bodyParams.length > 1) {
      this.reportError(`\`${operationId}\` has ${bodyParams.length} body parameters. Only one is allowed.`);
    } else if (bodyParams.length > 0 && formParams.length > 0) {
      this.reportError(
        `\`${operationId}\` has \`body\` and \`formData\` parameters. Only one or the other is allowed.`
      );
    }
  }
  /**
   * Validates path parameters for the given path.
   *
   */
  validatePathParameters(params, pathId, operationId) {
    const placeholders = pathId.match(pathParameterTemplateRegExp) || [];
    for (let i = 0; i < placeholders.length; i++) {
      for (let j = i + 1; j < placeholders.length; j++) {
        if (placeholders[i] === placeholders[j]) {
          this.reportError(`\`${operationId}\` has multiple path placeholders named \`${placeholders[i]}\`.`);
        }
      }
    }
    params.filter((param) => param.in === "path").forEach((param) => {
      if (param.required !== true) {
        if (this.rules["non-optional-path-parameters"] === "warning") {
          this.reportWarning(
            `Path parameters should not be optional. Set \`required=true\` for the \`${param.name}\` parameter at \`${operationId}\`.`
          );
        } else {
          this.reportError(
            `Path parameters cannot be optional. Set \`required=true\` for the \`${param.name}\` parameter at \`${operationId}\`.`
          );
        }
      }
      const match = placeholders.indexOf(`{${param.name}}`);
      if (match === -1) {
        const error = `\`${operationId}\` has a path parameter named \`${param.name}\`, but there is no corresponding \`{${param.name}}\` in the path string.`;
        if (this.rules["path-parameters-not-in-path"] === "warning") {
          this.reportWarning(error);
        } else {
          this.reportError(error);
        }
      }
      placeholders.splice(match, 1);
    });
    if (placeholders.length > 0) {
      const list = new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(
        placeholders.map((placeholder) => `\`${placeholder}\``)
      );
      const error = `\`${operationId}\` is missing path parameter(s) for ${list}.`;
      if (this.rules["path-parameters-not-in-parameters"] === "warning") {
        this.reportWarning(error);
      } else {
        this.reportError(error);
      }
    }
  }
  /**
   * Validates data types of parameters for the given operation.
   *
   */
  validateParameterTypes(params, operation, operationId) {
    params.forEach((param) => {
      const parameterId = `${operationId}/parameters/${param.name}`;
      let schema;
      switch (param.in) {
        case "body":
          schema = param.schema;
          break;
        case "formData":
          schema = param;
          break;
        default:
          schema = param;
      }
      this.validateSchema(schema, parameterId);
      this.validateRequiredPropertiesExist(schema, parameterId);
      if (schema.type === "file") {
        const formData = /multipart\/(.*\+)?form-data/;
        const urlEncoded = /application\/(.*\+)?x-www-form-urlencoded/;
        const consumes = operation.consumes || this.api.consumes || [];
        const hasValidMimeType = consumes.some((consume) => {
          return formData.test(consume) || urlEncoded.test(consume);
        });
        if (!hasValidMimeType) {
          this.reportError(
            `\`${operationId}\` has a file parameter, so it must consume \`multipart/form-data\` or \`application/x-www-form-urlencoded\`.`
          );
        }
      }
    });
  }
  /**
   * Validates the given response object.
   *
   */
  validateResponse(code, response, responseId) {
    if (code !== "default") {
      if (typeof code === "number" && (code < 100 || code > 599) || typeof code === "string" && (Number(code) < 100 || Number(code) > 599)) {
        this.reportError(`\`${responseId}\` has an invalid response code: ${code}`);
      }
    }
    Object.keys(response.headers || {}).forEach((headerName) => {
      const header = response.headers[headerName];
      const headerId = `${responseId}/headers/${headerName}`;
      this.validateSchema(header, headerId);
    });
    if (response.schema) {
      if ("$ref" in response.schema) {
        return;
      }
      this.validateSchema(response.schema, `${responseId}/schema`);
    }
  }
  /**
   * Validates the given Swagger schema object.
   *
   */
  validateSchema(schema, schemaId) {
    if (schema.type === "array" && !schema.items) {
      if (this.rules["array-without-items"] === "warning") {
        this.reportWarning(`\`${schemaId}\` is an array, so it should include an \`items\` schema.`);
      } else {
        this.reportError(`\`${schemaId}\` is an array, so it must include an \`items\` schema.`);
      }
    }
  }
  /**
   * Validates that the declared properties of the given Swagger schema object actually exist.
   *
   */
  validateRequiredPropertiesExist(schema, schemaId) {
    if (schema.required && Array.isArray(schema.required)) {
      const props = {};
      this.collectProperties(schema, props);
      schema.required.forEach((requiredProperty) => {
        if (!props[requiredProperty]) {
          const error = `Property \`${requiredProperty}\` is listed as required but does not exist in \`${schemaId}\`.`;
          if (this.rules["unknown-required-schema-property"] === "warning") {
            this.reportWarning(error);
          } else {
            this.reportError(error);
          }
        }
      });
    }
  }
  /**
   * Recursively collects all properties of a schema and its ancestors. They are added to the
   * supplied `props` object.
   *
   */
  collectProperties(schemaObj, props) {
    if (schemaObj.properties) {
      Object.keys(schemaObj.properties).forEach((property) => {
        if (schemaObj.properties.hasOwnProperty(property)) {
          props[property] = schemaObj.properties[property];
        }
      });
    }
    if (schemaObj.allOf) {
      schemaObj.allOf.forEach((parent) => {
        this.collectProperties(parent, props);
      });
    }
  }
  /**
   * Validates security definitions against their declared `type`.
   *
   * AJV uses `oneOf` to validate `securityDefinitions`, so when a definition is malformed AJV
   * fails every branch and produces overwhelming, unhelpful errors. This pre-AJV pass surfaces
   * a single targeted error per problem.
   *
   * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#security-scheme-object}
   */
  checkSecurityDefinitions() {
    const securityDefinitions = this.api.securityDefinitions;
    if (!securityDefinitions) {
      return;
    }
    const validApiKeyIn = ["query", "header"];
    Object.keys(securityDefinitions).forEach((name) => {
      const definition = securityDefinitions[name];
      const definitionId = `/securityDefinitions/${name}`;
      const reportIssue = (message) => this.reportSecuritySchemeIssue(message, definitionId);
      const type = definition.type;
      if (type === "http") {
        reportIssue(
          `\`${definitionId}\` uses \`type: http\`, which is an OpenAPI 3.x value. In Swagger 2.0 use \`type: basic\` for HTTP Basic auth.`
        );
        return;
      }
      if (type === "apiKey" && typeof definition.in === "string" && !validApiKeyIn.includes(definition.in)) {
        reportIssue(
          `\`${definitionId}\` has an invalid \`in\` value: \`${definition.in}\`. Swagger 2.0 only supports \`query\` or \`header\`.`
        );
      }
    });
  }
  reportSecuritySchemeIssue(message, definitionId) {
    this.flagInstancePath(definitionId);
    if (this.rules["invalid-security-scheme-properties"] === "warning") {
      this.reportWarning(message);
    } else {
      this.reportError(message);
    }
  }
  /**
   * Checks the given parameter list for duplicates.
   *
   */
  checkForDuplicates(params, schemaId) {
    for (let i = 0; i < params.length - 1; i++) {
      const outer = params[i];
      for (let j = i + 1; j < params.length; j++) {
        const inner = params[j];
        if (outer.name === inner.name && outer.in === inner.in) {
          const error = `Found multiple \`${outer.in}\` parameters named \`${outer.name}\` in \`${schemaId}\`.`;
          if (this.rules["duplicate-non-request-body-parameters"] === "warning") {
            this.reportWarning(error);
          } else {
            this.reportError(error);
          }
        }
      }
    }
  }
};

// src/validators/spec.ts
function validateSpec(api, rules) {
  let validator;
  const specificationName = getSpecificationName(api);
  if (chunk_IYQ77VVR_isOpenAPI(api)) {
    validator = new OpenAPISpecificationValidator(api, rules.openapi);
  } else {
    validator = new SwaggerSpecificationValidator(api, rules.swagger);
  }
  validator.run();
  if (!validator.errors.length) {
    return {
      valid: true,
      warnings: validator.warnings,
      specification: specificationName
    };
  }
  return {
    valid: false,
    errors: validator.errors,
    warnings: validator.warnings,
    additionalErrors: 0,
    specification: specificationName
  };
}
function validateSpecPreSchema(api, rules) {
  let validator;
  const specificationName = getSpecificationName(api);
  if (chunk_IYQ77VVR_isOpenAPI(api)) {
    validator = new OpenAPISpecificationValidator(api, rules.openapi);
  } else {
    validator = new SwaggerSpecificationValidator(api, rules.swagger);
  }
  validator.runPreSchemaChecks();
  const flaggedInstancePaths = validator.flaggedInstancePaths;
  if (!validator.errors.length) {
    return {
      flaggedInstancePaths,
      result: {
        valid: true,
        warnings: validator.warnings,
        specification: specificationName
      }
    };
  }
  return {
    flaggedInstancePaths,
    result: {
      valid: false,
      errors: validator.errors,
      warnings: validator.warnings,
      additionalErrors: 0,
      specification: specificationName
    }
  };
}

// src/index.ts
async function parse(api, options) {
  const args = normalizeArguments(api);
  const parserOptions = convertOptionsForParser(options);
  const parser = new $RefParser();
  const schema = await parser.parse(args.path, args.schema, parserOptions);
  repairSchema(schema, args.path);
  return schema;
}
async function bundle(api, options) {
  const args = normalizeArguments(api);
  const parserOptions = convertOptionsForParser(options);
  const parser = new $RefParser();
  await parser.bundle(args.path, args.schema, parserOptions);
  repairSchema(parser.schema, args.path);
  return parser.schema;
}
async function dereference(api, options) {
  const args = normalizeArguments(api);
  const parserOptions = convertOptionsForParser(options);
  const parser = new $RefParser();
  await parser.dereference(args.path, args.schema, parserOptions);
  repairSchema(parser.schema, args.path);
  return parser.schema;
}
async function validate(api, options) {
  const args = normalizeArguments(api);
  const parserOptions = convertOptionsForParser(options);
  let result;
  const circular$RefOption = parserOptions.dereference.circular;
  parserOptions.dereference.circular = "ignore";
  const parser = new lib.$RefParser();
  try {
    await parser.dereference(args.path, args.schema, parserOptions);
  } catch (err) {
    if (err instanceof lib.MissingPointerError) {
      return {
        valid: false,
        errors: [{ message: err.message }],
        warnings: [],
        additionalErrors: 0,
        specification: null
      };
    }
    throw err;
  }
  if (!isSwagger(parser.schema) && !chunk_IYQ77VVR_isOpenAPI(parser.schema)) {
    return {
      valid: false,
      errors: [{ message: "Supplied schema is not a valid API definition." }],
      warnings: [],
      additionalErrors: 0,
      specification: null
    };
  }
  parserOptions.dereference.circular = circular$RefOption;
  const openapiRules = options?.validate?.rules?.openapi;
  const swaggerRules = options?.validate?.rules?.swagger;
  const rules = {
    openapi: {
      "array-without-items": openapiRules?.["array-without-items"] || "error",
      "duplicate-non-request-body-parameters": openapiRules?.["duplicate-non-request-body-parameters"] || "error",
      "duplicate-operation-id": openapiRules?.["duplicate-operation-id"] || "error",
      "invalid-security-scheme-properties": openapiRules?.["invalid-security-scheme-properties"] || "error",
      "non-optional-path-parameters": openapiRules?.["non-optional-path-parameters"] || "error",
      "path-parameters-not-in-parameters": openapiRules?.["path-parameters-not-in-parameters"] || "error",
      "path-parameters-not-in-path": openapiRules?.["path-parameters-not-in-path"] || "error"
    },
    swagger: {
      "array-without-items": swaggerRules?.["array-without-items"] || "error",
      "duplicate-non-request-body-parameters": swaggerRules?.["duplicate-non-request-body-parameters"] || "error",
      "duplicate-operation-id": swaggerRules?.["duplicate-operation-id"] || "error",
      "invalid-security-scheme-properties": swaggerRules?.["invalid-security-scheme-properties"] || "error",
      "non-optional-path-parameters": swaggerRules?.["non-optional-path-parameters"] || "error",
      "path-parameters-not-in-parameters": swaggerRules?.["path-parameters-not-in-parameters"] || "error",
      "path-parameters-not-in-path": swaggerRules?.["path-parameters-not-in-path"] || "error",
      "unknown-required-schema-property": swaggerRules?.["unknown-required-schema-property"] || "error"
    }
  };
  const { result: preSchemaResult, flaggedInstancePaths } = validateSpecPreSchema(parser.schema, rules);
  if (!preSchemaResult.valid) {
    return preSchemaResult;
  }
  result = validateSchema(parser.schema, options, flaggedInstancePaths);
  if (!result.valid) {
    if (preSchemaResult.warnings.length) {
      result.warnings = [...preSchemaResult.warnings, ...result.warnings];
    }
    return result;
  }
  if (parser.$refs?.circular) {
    if (circular$RefOption === true) {
      (0,lib.dereferenceInternal)(parser, parserOptions);
    } else if (circular$RefOption === false) {
      throw new ReferenceError(
        "The API contains circular references but the validator is configured to not permit them."
      );
    }
  }
  result = validateSpec(parser.schema, rules);
  if (preSchemaResult.warnings.length) {
    result.warnings = [...preSchemaResult.warnings, ...result.warnings];
  }
  return result;
}
function compileErrors(result) {
  const specName = result.specification || "API definition";
  const status = !result.valid ? "failed" : "succeeded, but with warnings";
  const message = [`${specName} schema validation ${status}.`];
  if (result.valid === false) {
    if (result.errors.length) {
      message.push(...result.errors.map((err) => err.message));
    }
  }
  if (result.warnings.length) {
    if (result.valid === false && result.errors.length) {
      message.push("We have also found some additional warnings:");
    }
    message.push(...result.warnings.map((warn) => warn.message));
  }
  if (result.valid === false && result.additionalErrors > 0) {
    message.push(
      `Plus an additional ${result.additionalErrors} errors. Please resolve the above and re-run validation to see more.`
    );
  }
  return message.join("\n\n");
}

//# sourceMappingURL=index.js.map

/***/ }),

/***/ 8079:
/***/ ((__webpack_module__, __unused_webpack___webpack_exports__, __nccwpck_require__) => {

__nccwpck_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_0__ = __nccwpck_require__(1455);
/* harmony import */ var _readme_openapi_parser__WEBPACK_IMPORTED_MODULE_1__ = __nccwpck_require__(6730);



let url;
if ( process.argv[ 2 ] ) {
	url = process.argv[ 2 ];
} else {
	console.error( 'Usage: node swagger-validator.js <URL>' );
	throw new Error( 'URL is required' );
}

const source = /^https?:\/\//i.test( url )
	? await fetch( url ).then( response => {
		if ( ! response.ok ) {
			throw new Error( `Failed to fetch ${ url }: ${ response.status } ${ response.statusText }` );
		}

		return response.json();
	} )
	: await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.readFile)( url, 'utf-8' ).then( data => JSON.parse( data ) );

(0,_readme_openapi_parser__WEBPACK_IMPORTED_MODULE_1__/* .validate */ .tf)( source, { resolve: { external: true, file: true } } )
	.then( result => {
		if ( result.valid ) {
			console.log( 'The API definition is valid!' );
		} else {
			console.log( 'The API definition is NOT valid!' );
			result.errors.forEach( err => {
				console.log( '- %s', err.message );
			} );
		}

		result.warnings.forEach( warning => {
			console.log( '(!) %s', warning.message );
		} );
	} )
	.catch( err => {
		console.error( err );
		throw err;
	} );

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } }, 1);

/***/ }),

/***/ 6337:
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"id":"http://json-schema.org/draft-04/schema#","$schema":"http://json-schema.org/draft-04/schema#","description":"Core schema meta-schema","definitions":{"schemaArray":{"type":"array","minItems":1,"items":{"$ref":"#"}},"positiveInteger":{"type":"integer","minimum":0},"positiveIntegerDefault0":{"allOf":[{"$ref":"#/definitions/positiveInteger"},{"default":0}]},"simpleTypes":{"enum":["array","boolean","integer","null","number","object","string"]},"stringArray":{"type":"array","items":{"type":"string"},"minItems":1,"uniqueItems":true}},"type":"object","properties":{"id":{"type":"string","format":"uri"},"$schema":{"type":"string","format":"uri"},"title":{"type":"string"},"description":{"type":"string"},"default":{},"multipleOf":{"type":"number","minimum":0,"exclusiveMinimum":true},"maximum":{"type":"number"},"exclusiveMaximum":{"type":"boolean","default":false},"minimum":{"type":"number"},"exclusiveMinimum":{"type":"boolean","default":false},"maxLength":{"$ref":"#/definitions/positiveInteger"},"minLength":{"$ref":"#/definitions/positiveIntegerDefault0"},"pattern":{"type":"string","format":"regex"},"additionalItems":{"anyOf":[{"type":"boolean"},{"$ref":"#"}],"default":{}},"items":{"anyOf":[{"$ref":"#"},{"$ref":"#/definitions/schemaArray"}],"default":{}},"maxItems":{"$ref":"#/definitions/positiveInteger"},"minItems":{"$ref":"#/definitions/positiveIntegerDefault0"},"uniqueItems":{"type":"boolean","default":false},"maxProperties":{"$ref":"#/definitions/positiveInteger"},"minProperties":{"$ref":"#/definitions/positiveIntegerDefault0"},"required":{"$ref":"#/definitions/stringArray"},"additionalProperties":{"anyOf":[{"type":"boolean"},{"$ref":"#"}],"default":{}},"definitions":{"type":"object","additionalProperties":{"$ref":"#"},"default":{}},"properties":{"type":"object","additionalProperties":{"$ref":"#"},"default":{}},"patternProperties":{"type":"object","additionalProperties":{"$ref":"#"},"default":{}},"dependencies":{"type":"object","additionalProperties":{"anyOf":[{"$ref":"#"},{"$ref":"#/definitions/stringArray"}]}},"enum":{"type":"array","minItems":1,"uniqueItems":true},"type":{"anyOf":[{"$ref":"#/definitions/simpleTypes"},{"type":"array","items":{"$ref":"#/definitions/simpleTypes"},"minItems":1,"uniqueItems":true}]},"allOf":{"$ref":"#/definitions/schemaArray"},"anyOf":{"$ref":"#/definitions/schemaArray"},"oneOf":{"$ref":"#/definitions/schemaArray"},"not":{"$ref":"#"}},"dependencies":{"exclusiveMaximum":["maximum"],"exclusiveMinimum":["minimum"]},"default":{}}');

/***/ }),

/***/ 3837:
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"$id":"https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#","description":"Meta-schema for $data reference (JSON AnySchema extension proposal)","type":"object","required":["$data"],"properties":{"$data":{"type":"string","anyOf":[{"format":"relative-json-pointer"},{"format":"json-pointer"}]}},"additionalProperties":false}');

/***/ }),

/***/ 7216:
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://json-schema.org/draft/2020-12/meta/applicator","$vocabulary":{"https://json-schema.org/draft/2020-12/vocab/applicator":true},"$dynamicAnchor":"meta","title":"Applicator vocabulary meta-schema","type":["object","boolean"],"properties":{"prefixItems":{"$ref":"#/$defs/schemaArray"},"items":{"$dynamicRef":"#meta"},"contains":{"$dynamicRef":"#meta"},"additionalProperties":{"$dynamicRef":"#meta"},"properties":{"type":"object","additionalProperties":{"$dynamicRef":"#meta"},"default":{}},"patternProperties":{"type":"object","additionalProperties":{"$dynamicRef":"#meta"},"propertyNames":{"format":"regex"},"default":{}},"dependentSchemas":{"type":"object","additionalProperties":{"$dynamicRef":"#meta"},"default":{}},"propertyNames":{"$dynamicRef":"#meta"},"if":{"$dynamicRef":"#meta"},"then":{"$dynamicRef":"#meta"},"else":{"$dynamicRef":"#meta"},"allOf":{"$ref":"#/$defs/schemaArray"},"anyOf":{"$ref":"#/$defs/schemaArray"},"oneOf":{"$ref":"#/$defs/schemaArray"},"not":{"$dynamicRef":"#meta"}},"$defs":{"schemaArray":{"type":"array","minItems":1,"items":{"$dynamicRef":"#meta"}}}}');

/***/ }),

/***/ 8226:
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://json-schema.org/draft/2020-12/meta/content","$vocabulary":{"https://json-schema.org/draft/2020-12/vocab/content":true},"$dynamicAnchor":"meta","title":"Content vocabulary meta-schema","type":["object","boolean"],"properties":{"contentEncoding":{"type":"string"},"contentMediaType":{"type":"string"},"contentSchema":{"$dynamicRef":"#meta"}}}');

/***/ }),

/***/ 518:
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://json-schema.org/draft/2020-12/meta/core","$vocabulary":{"https://json-schema.org/draft/2020-12/vocab/core":true},"$dynamicAnchor":"meta","title":"Core vocabulary meta-schema","type":["object","boolean"],"properties":{"$id":{"$ref":"#/$defs/uriReferenceString","$comment":"Non-empty fragments not allowed.","pattern":"^[^#]*#?$"},"$schema":{"$ref":"#/$defs/uriString"},"$ref":{"$ref":"#/$defs/uriReferenceString"},"$anchor":{"$ref":"#/$defs/anchorString"},"$dynamicRef":{"$ref":"#/$defs/uriReferenceString"},"$dynamicAnchor":{"$ref":"#/$defs/anchorString"},"$vocabulary":{"type":"object","propertyNames":{"$ref":"#/$defs/uriString"},"additionalProperties":{"type":"boolean"}},"$comment":{"type":"string"},"$defs":{"type":"object","additionalProperties":{"$dynamicRef":"#meta"}}},"$defs":{"anchorString":{"type":"string","pattern":"^[A-Za-z_][-A-Za-z0-9._]*$"},"uriString":{"type":"string","format":"uri"},"uriReferenceString":{"type":"string","format":"uri-reference"}}}');

/***/ }),

/***/ 4588:
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://json-schema.org/draft/2020-12/meta/format-annotation","$vocabulary":{"https://json-schema.org/draft/2020-12/vocab/format-annotation":true},"$dynamicAnchor":"meta","title":"Format vocabulary meta-schema for annotation results","type":["object","boolean"],"properties":{"format":{"type":"string"}}}');

/***/ }),

/***/ 5707:
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://json-schema.org/draft/2020-12/meta/meta-data","$vocabulary":{"https://json-schema.org/draft/2020-12/vocab/meta-data":true},"$dynamicAnchor":"meta","title":"Meta-data vocabulary meta-schema","type":["object","boolean"],"properties":{"title":{"type":"string"},"description":{"type":"string"},"default":true,"deprecated":{"type":"boolean","default":false},"readOnly":{"type":"boolean","default":false},"writeOnly":{"type":"boolean","default":false},"examples":{"type":"array","items":true}}}');

/***/ }),

/***/ 9547:
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://json-schema.org/draft/2020-12/meta/unevaluated","$vocabulary":{"https://json-schema.org/draft/2020-12/vocab/unevaluated":true},"$dynamicAnchor":"meta","title":"Unevaluated applicator vocabulary meta-schema","type":["object","boolean"],"properties":{"unevaluatedItems":{"$dynamicRef":"#meta"},"unevaluatedProperties":{"$dynamicRef":"#meta"}}}');

/***/ }),

/***/ 7082:
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://json-schema.org/draft/2020-12/meta/validation","$vocabulary":{"https://json-schema.org/draft/2020-12/vocab/validation":true},"$dynamicAnchor":"meta","title":"Validation vocabulary meta-schema","type":["object","boolean"],"properties":{"type":{"anyOf":[{"$ref":"#/$defs/simpleTypes"},{"type":"array","items":{"$ref":"#/$defs/simpleTypes"},"minItems":1,"uniqueItems":true}]},"const":true,"enum":{"type":"array","items":true},"multipleOf":{"type":"number","exclusiveMinimum":0},"maximum":{"type":"number"},"exclusiveMaximum":{"type":"number"},"minimum":{"type":"number"},"exclusiveMinimum":{"type":"number"},"maxLength":{"$ref":"#/$defs/nonNegativeInteger"},"minLength":{"$ref":"#/$defs/nonNegativeIntegerDefault0"},"pattern":{"type":"string","format":"regex"},"maxItems":{"$ref":"#/$defs/nonNegativeInteger"},"minItems":{"$ref":"#/$defs/nonNegativeIntegerDefault0"},"uniqueItems":{"type":"boolean","default":false},"maxContains":{"$ref":"#/$defs/nonNegativeInteger"},"minContains":{"$ref":"#/$defs/nonNegativeInteger","default":1},"maxProperties":{"$ref":"#/$defs/nonNegativeInteger"},"minProperties":{"$ref":"#/$defs/nonNegativeIntegerDefault0"},"required":{"$ref":"#/$defs/stringArray"},"dependentRequired":{"type":"object","additionalProperties":{"$ref":"#/$defs/stringArray"}}},"$defs":{"nonNegativeInteger":{"type":"integer","minimum":0},"nonNegativeIntegerDefault0":{"$ref":"#/$defs/nonNegativeInteger","default":0},"simpleTypes":{"enum":["array","boolean","integer","null","number","object","string"]},"stringArray":{"type":"array","items":{"type":"string"},"uniqueItems":true,"default":[]}}}');

/***/ }),

/***/ 1678:
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://json-schema.org/draft/2020-12/schema","$vocabulary":{"https://json-schema.org/draft/2020-12/vocab/core":true,"https://json-schema.org/draft/2020-12/vocab/applicator":true,"https://json-schema.org/draft/2020-12/vocab/unevaluated":true,"https://json-schema.org/draft/2020-12/vocab/validation":true,"https://json-schema.org/draft/2020-12/vocab/meta-data":true,"https://json-schema.org/draft/2020-12/vocab/format-annotation":true,"https://json-schema.org/draft/2020-12/vocab/content":true},"$dynamicAnchor":"meta","title":"Core and Validation specifications meta-schema","allOf":[{"$ref":"meta/core"},{"$ref":"meta/applicator"},{"$ref":"meta/unevaluated"},{"$ref":"meta/validation"},{"$ref":"meta/meta-data"},{"$ref":"meta/format-annotation"},{"$ref":"meta/content"}],"type":["object","boolean"],"$comment":"This meta-schema also defines keywords that have appeared in previous drafts in order to prevent incompatible extensions as they remain in common use.","properties":{"definitions":{"$comment":"\\"definitions\\" has been replaced by \\"$defs\\".","type":"object","additionalProperties":{"$dynamicRef":"#meta"},"deprecated":true,"default":{}},"dependencies":{"$comment":"\\"dependencies\\" has been split and replaced by \\"dependentSchemas\\" and \\"dependentRequired\\" in order to serve their differing semantics.","type":"object","additionalProperties":{"anyOf":[{"$dynamicRef":"#meta"},{"$ref":"meta/validation#/$defs/stringArray"}]},"deprecated":true,"default":{}},"$recursiveAnchor":{"$comment":"\\"$recursiveAnchor\\" has been replaced by \\"$dynamicAnchor\\".","$ref":"meta/core#/$defs/anchorString","deprecated":true},"$recursiveRef":{"$comment":"\\"$recursiveRef\\" has been replaced by \\"$dynamicRef\\".","$ref":"meta/core#/$defs/uriReferenceString","deprecated":true}}}');

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nccwpck_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	var threw = true;
/******/ 	try {
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 		threw = false;
/******/ 	} finally {
/******/ 		if(threw) delete __webpack_module_cache__[moduleId];
/******/ 	}
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/async module */
/******/ (() => {
/******/ 	var webpackQueues = typeof Symbol === "function" ? Symbol("webpack queues") : "__webpack_queues__";
/******/ 	var webpackExports = typeof Symbol === "function" ? Symbol("webpack exports") : "__webpack_exports__";
/******/ 	var webpackError = typeof Symbol === "function" ? Symbol("webpack error") : "__webpack_error__";
/******/ 	var resolveQueue = (queue) => {
/******/ 		if(queue && queue.d < 1) {
/******/ 			queue.d = 1;
/******/ 			queue.forEach((fn) => (fn.r--));
/******/ 			queue.forEach((fn) => (fn.r-- ? fn.r++ : fn()));
/******/ 		}
/******/ 	}
/******/ 	var wrapDeps = (deps) => (deps.map((dep) => {
/******/ 		if(dep !== null && typeof dep === "object") {
/******/ 			if(dep[webpackQueues]) return dep;
/******/ 			if(dep.then) {
/******/ 				var queue = [];
/******/ 				queue.d = 0;
/******/ 				dep.then((r) => {
/******/ 					obj[webpackExports] = r;
/******/ 					resolveQueue(queue);
/******/ 				}, (e) => {
/******/ 					obj[webpackError] = e;
/******/ 					resolveQueue(queue);
/******/ 				});
/******/ 				var obj = {};
/******/ 				obj[webpackQueues] = (fn) => (fn(queue));
/******/ 				return obj;
/******/ 			}
/******/ 		}
/******/ 		var ret = {};
/******/ 		ret[webpackQueues] = x => {};
/******/ 		ret[webpackExports] = dep;
/******/ 		return ret;
/******/ 	}));
/******/ 	__nccwpck_require__.a = (module, body, hasAwait) => {
/******/ 		var queue;
/******/ 		hasAwait && ((queue = []).d = -1);
/******/ 		var depQueues = new Set();
/******/ 		var exports = module.exports;
/******/ 		var currentDeps;
/******/ 		var outerResolve;
/******/ 		var reject;
/******/ 		var promise = new Promise((resolve, rej) => {
/******/ 			reject = rej;
/******/ 			outerResolve = resolve;
/******/ 		});
/******/ 		promise[webpackExports] = exports;
/******/ 		promise[webpackQueues] = (fn) => (queue && fn(queue), depQueues.forEach(fn), promise["catch"](x => {}));
/******/ 		module.exports = promise;
/******/ 		body((deps) => {
/******/ 			currentDeps = wrapDeps(deps);
/******/ 			var fn;
/******/ 			var getResult = () => (currentDeps.map((d) => {
/******/ 				if(d[webpackError]) throw d[webpackError];
/******/ 				return d[webpackExports];
/******/ 			}))
/******/ 			var promise = new Promise((resolve) => {
/******/ 				fn = () => (resolve(getResult));
/******/ 				fn.r = 0;
/******/ 				var fnQueue = (q) => (q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, q.push(fn))));
/******/ 				currentDeps.map((dep) => (dep[webpackQueues](fnQueue)));
/******/ 			});
/******/ 			return fn.r ? promise : getResult();
/******/ 		}, (err) => ((err ? reject(promise[webpackError] = err) : outerResolve(exports)), resolveQueue(queue)));
/******/ 		queue && queue.d < 0 && (queue.d = 0);
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__nccwpck_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
/******/ 
/******/ // startup
/******/ // Load entry module and return exports
/******/ // This entry module used 'module' so it can't be inlined
/******/ var __webpack_exports__ = __nccwpck_require__(8079);
/******/ __webpack_exports__ = await __webpack_exports__;
/******/ 
