import { describe, it, expect } from 'vitest';
import { accessAND, conditional, accessOR } from './accessComposition';
// Mock access args for testing
const mockArgs = {
    req: {
        user: null,
        headers: new Headers(),
        payload: {},
        context: {}
    }
};
const mockArgsWithUser = {
    req: {
        user: {
            id: '123',
            email: 'test@example.com'
        },
        headers: new Headers(),
        payload: {},
        context: {}
    }
};
describe('Access Composition Utilities', ()=>{
    describe('or', ()=>{
        it('should return true when first checker returns true', async ()=>{
            const checker1 = async ()=>true;
            const checker2 = async ()=>false;
            const result = await accessOR(checker1, checker2)(mockArgs);
            expect(result).toBe(true);
        });
        it('should return true when any checker returns true', async ()=>{
            const checker1 = async ()=>false;
            const checker2 = async ()=>true;
            const checker3 = async ()=>false;
            const result = await accessOR(checker1, checker2, checker3)(mockArgs);
            expect(result).toBe(true);
        });
        it('should return false when all checkers return false', async ()=>{
            const checker1 = async ()=>false;
            const checker2 = async ()=>false;
            const checker3 = async ()=>false;
            const result = await accessOR(checker1, checker2, checker3)(mockArgs);
            expect(result).toBe(false);
        });
        it('should combine Where queries with OR logic', async ()=>{
            const checker1 = async ()=>({
                    customer: {
                        equals: '123'
                    }
                });
            const checker2 = async ()=>({
                    status: {
                        equals: 'published'
                    }
                });
            const result = await accessOR(checker1, checker2)(mockArgs);
            expect(result).toEqual({
                or: [
                    {
                        customer: {
                            equals: '123'
                        }
                    },
                    {
                        status: {
                            equals: 'published'
                        }
                    }
                ]
            });
        });
        it('should return true when one checker returns true and others return Where queries', async ()=>{
            const checker1 = async ()=>({
                    customer: {
                        equals: '123'
                    }
                });
            const checker2 = async ()=>true;
            const result = await accessOR(checker1, checker2)(mockArgs);
            expect(result).toBe(true);
        });
        it('should ignore false values when combining Where queries', async ()=>{
            const checker1 = async ()=>false;
            const checker2 = async ()=>({
                    customer: {
                        equals: '123'
                    }
                });
            const checker3 = async ()=>false;
            const checker4 = async ()=>({
                    status: {
                        equals: 'published'
                    }
                });
            const result = await accessOR(checker1, checker2, checker3, checker4)(mockArgs);
            expect(result).toEqual({
                or: [
                    {
                        customer: {
                            equals: '123'
                        }
                    },
                    {
                        status: {
                            equals: 'published'
                        }
                    }
                ]
            });
        });
        it('should return a single Where query when only one checker returns a Where query', async ()=>{
            const checker1 = async ()=>false;
            const checker2 = async ()=>({
                    customer: {
                        equals: '123'
                    }
                });
            const checker3 = async ()=>false;
            const result = await accessOR(checker1, checker2, checker3)(mockArgs);
            expect(result).toEqual({
                or: [
                    {
                        customer: {
                            equals: '123'
                        }
                    }
                ]
            });
        });
        it('should short-circuit on first true result for performance', async ()=>{
            let secondCheckerCalled = false;
            const checker1 = async ()=>true;
            const checker2 = async ()=>{
                secondCheckerCalled = true;
                return false;
            };
            await accessOR(checker1, checker2)(mockArgs);
            expect(secondCheckerCalled).toBe(false);
        });
        it('should handle empty checkers array', async ()=>{
            const result = await accessOR()(mockArgs);
            expect(result).toBe(false);
        });
        it('should handle complex nested Where queries', async ()=>{
            const checker1 = async ()=>({
                    and: [
                        {
                            customer: {
                                equals: '123'
                            }
                        },
                        {
                            status: {
                                equals: 'active'
                            }
                        }
                    ]
                });
            const checker2 = async ()=>({
                    role: {
                        equals: 'admin'
                    }
                });
            const result = await accessOR(checker1, checker2)(mockArgs);
            expect(result).toEqual({
                or: [
                    {
                        and: [
                            {
                                customer: {
                                    equals: '123'
                                }
                            },
                            {
                                status: {
                                    equals: 'active'
                                }
                            }
                        ]
                    },
                    {
                        role: {
                            equals: 'admin'
                        }
                    }
                ]
            });
        });
    });
    describe('and', ()=>{
        it('should return false when any checker returns false', async ()=>{
            const checker1 = async ()=>true;
            const checker2 = async ()=>false;
            const result = await accessAND(checker1, checker2)(mockArgs);
            expect(result).toBe(false);
        });
        it('should return true when all checkers return true', async ()=>{
            const checker1 = async ()=>true;
            const checker2 = async ()=>true;
            const checker3 = async ()=>true;
            const result = await accessAND(checker1, checker2, checker3)(mockArgs);
            expect(result).toBe(true);
        });
        it('should combine Where queries with AND logic', async ()=>{
            const checker1 = async ()=>({
                    customer: {
                        equals: '123'
                    }
                });
            const checker2 = async ()=>({
                    status: {
                        equals: 'published'
                    }
                });
            const result = await accessAND(checker1, checker2)(mockArgs);
            expect(result).toEqual({
                and: [
                    {
                        customer: {
                            equals: '123'
                        }
                    },
                    {
                        status: {
                            equals: 'published'
                        }
                    }
                ]
            });
        });
        it('should return false when one checker returns false and others return Where queries', async ()=>{
            const checker1 = async ()=>({
                    customer: {
                        equals: '123'
                    }
                });
            const checker2 = async ()=>false;
            const result = await accessAND(checker1, checker2)(mockArgs);
            expect(result).toBe(false);
        });
        it('should return Where query when all checkers return Where queries except one returns true', async ()=>{
            const checker1 = async ()=>true;
            const checker2 = async ()=>({
                    customer: {
                        equals: '123'
                    }
                });
            const checker3 = async ()=>({
                    status: {
                        equals: 'published'
                    }
                });
            const result = await accessAND(checker1, checker2, checker3)(mockArgs);
            expect(result).toEqual({
                and: [
                    {
                        customer: {
                            equals: '123'
                        }
                    },
                    {
                        status: {
                            equals: 'published'
                        }
                    }
                ]
            });
        });
        it('should short-circuit on first false result for performance', async ()=>{
            let secondCheckerCalled = false;
            const checker1 = async ()=>false;
            const checker2 = async ()=>{
                secondCheckerCalled = true;
                return true;
            };
            await accessAND(checker1, checker2)(mockArgs);
            expect(secondCheckerCalled).toBe(false);
        });
        it('should handle empty checkers array', async ()=>{
            const result = await accessAND()(mockArgs);
            expect(result).toBe(true);
        });
        it('should return a single Where query when only one checker returns a Where query', async ()=>{
            const checker1 = async ()=>true;
            const checker2 = async ()=>({
                    customer: {
                        equals: '123'
                    }
                });
            const checker3 = async ()=>true;
            const result = await accessAND(checker1, checker2, checker3)(mockArgs);
            expect(result).toEqual({
                and: [
                    {
                        customer: {
                            equals: '123'
                        }
                    }
                ]
            });
        });
        it('should handle complex nested Where queries', async ()=>{
            const checker1 = async ()=>({
                    or: [
                        {
                            customer: {
                                equals: '123'
                            }
                        },
                        {
                            customer: {
                                equals: '456'
                            }
                        }
                    ]
                });
            const checker2 = async ()=>({
                    status: {
                        equals: 'active'
                    }
                });
            const result = await accessAND(checker1, checker2)(mockArgs);
            expect(result).toEqual({
                and: [
                    {
                        or: [
                            {
                                customer: {
                                    equals: '123'
                                }
                            },
                            {
                                customer: {
                                    equals: '456'
                                }
                            }
                        ]
                    },
                    {
                        status: {
                            equals: 'active'
                        }
                    }
                ]
            });
        });
        it('should return false immediately when first checker returns false', async ()=>{
            const checker1 = async ()=>false;
            const checker2 = async ()=>{
                throw new Error('Should not be called');
            };
            const result = await accessAND(checker1, checker2)(mockArgs);
            expect(result).toBe(false);
        });
    });
    describe('conditional', ()=>{
        it('should apply checker when condition is true', async ()=>{
            const checker = async ()=>true;
            const result = await conditional(true, checker)(mockArgs);
            expect(result).toBe(true);
        });
        it('should return false when condition is false', async ()=>{
            const checker = async ()=>true;
            const result = await conditional(false, checker)(mockArgs);
            expect(result).toBe(false);
        });
        it('should apply checker when condition function returns true', async ()=>{
            const condition = ({ req })=>!!req.user;
            const checker = async ()=>true;
            const result = await conditional(condition, checker)(mockArgsWithUser);
            expect(result).toBe(true);
        });
        it('should return false when condition function returns false', async ()=>{
            const condition = ({ req })=>!!req.user;
            const checker = async ()=>true;
            const result = await conditional(condition, checker)(mockArgs);
            expect(result).toBe(false);
        });
        it('should pass Where query through when condition is true', async ()=>{
            const checker = async ()=>({
                    customer: {
                        equals: '123'
                    }
                });
            const result = await conditional(true, checker)(mockArgs);
            expect(result).toEqual({
                customer: {
                    equals: '123'
                }
            });
        });
        it('should not call checker when condition is false', async ()=>{
            let checkerCalled = false;
            const checker = async ()=>{
                checkerCalled = true;
                return true;
            };
            await conditional(false, checker)(mockArgs);
            expect(checkerCalled).toBe(false);
        });
        it('should evaluate condition function each time', async ()=>{
            const condition = ({ req })=>!!req.user;
            const checker = async ()=>true;
            // First call without user
            const result1 = await conditional(condition, checker)(mockArgs);
            expect(result1).toBe(false);
            // Second call with user
            const result2 = await conditional(condition, checker)(mockArgsWithUser);
            expect(result2).toBe(true);
        });
        it('should work with false checker result when condition is true', async ()=>{
            const checker = async ()=>false;
            const result = await conditional(true, checker)(mockArgs);
            expect(result).toBe(false);
        });
    });
    describe('combined composition', ()=>{
        it('should compose or, and, and conditional together', async ()=>{
            const isAdmin = async ({ req })=>req.user?.role === 'admin';
            const isOwner = async ({ req })=>({
                    customer: {
                        equals: req.user?.id
                    }
                });
            const isGuest = async ({ req })=>!req.user;
            const allowGuestCarts = true;
            const access = accessOR(isAdmin, accessAND(isOwner), conditional(allowGuestCarts, isGuest));
            // Guest user (no user)
            const guestResult = await access(mockArgs);
            expect(guestResult).toBe(true);
            // Admin user
            const adminResult = await access({
                req: {
                    user: {
                        id: '123',
                        role: 'admin'
                    },
                    headers: new Headers(),
                    payload: {},
                    context: {}
                }
            });
            expect(adminResult).toBe(true);
            // Regular user (owner)
            const ownerResult = await access({
                req: {
                    user: {
                        id: '123',
                        role: 'customer'
                    },
                    headers: new Headers(),
                    payload: {},
                    context: {}
                }
            });
            expect(ownerResult).toEqual({
                or: [
                    {
                        and: [
                            {
                                customer: {
                                    equals: '123'
                                }
                            }
                        ]
                    }
                ]
            });
        });
        it('should handle complex nested compositions', async ()=>{
            const checker1 = async ()=>({
                    status: {
                        equals: 'published'
                    }
                });
            const checker2 = async ()=>({
                    visibility: {
                        equals: 'public'
                    }
                });
            const checker3 = async ({ req })=>!!req.user;
            const checker4 = async ()=>({
                    customer: {
                        equals: '123'
                    }
                });
            // ((published AND public) OR (authenticated AND customer=123))
            const access = accessOR(accessAND(checker1, checker2), accessAND(checker3, checker4));
            // Without user
            const result1 = await access(mockArgs);
            expect(result1).toEqual({
                or: [
                    {
                        and: [
                            {
                                status: {
                                    equals: 'published'
                                }
                            },
                            {
                                visibility: {
                                    equals: 'public'
                                }
                            }
                        ]
                    }
                ]
            });
            // With user
            const result2 = await access(mockArgsWithUser);
            expect(result2).toEqual({
                or: [
                    {
                        and: [
                            {
                                status: {
                                    equals: 'published'
                                }
                            },
                            {
                                visibility: {
                                    equals: 'public'
                                }
                            }
                        ]
                    },
                    {
                        and: [
                            {
                                customer: {
                                    equals: '123'
                                }
                            }
                        ]
                    }
                ]
            });
        });
        it('should handle conditional inside or composition', async ()=>{
            const isAdmin = async ()=>false;
            const isGuest = async ()=>true;
            const allowGuestAccess = true;
            const access = accessOR(isAdmin, conditional(allowGuestAccess, isGuest));
            const result = await access(mockArgs);
            expect(result).toBe(true);
        });
        it('should handle conditional inside and composition', async ()=>{
            const hasPermission = async ()=>({
                    permissions: {
                        contains: 'read'
                    }
                });
            const isActiveUser = async ()=>true;
            const featureFlagEnabled = true;
            const access = accessAND(hasPermission, conditional(featureFlagEnabled, isActiveUser));
            const result = await access(mockArgs);
            expect(result).toEqual({
                and: [
                    {
                        permissions: {
                            contains: 'read'
                        }
                    }
                ]
            });
        });
        it('should correctly handle multiple levels of nesting', async ()=>{
            const a = async ()=>true;
            const b = async ()=>false;
            const c = async ()=>({
                    field1: {
                        equals: 'value1'
                    }
                });
            const d = async ()=>({
                    field2: {
                        equals: 'value2'
                    }
                });
            // (a AND (b OR (c AND d)))
            const access = accessAND(a, accessOR(b, accessAND(c, d)));
            const result = await access(mockArgs);
            expect(result).toEqual({
                and: [
                    {
                        or: [
                            {
                                and: [
                                    {
                                        field1: {
                                            equals: 'value1'
                                        }
                                    },
                                    {
                                        field2: {
                                            equals: 'value2'
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });
        });
    });
    describe('edge cases and failure scenarios', ()=>{
        it('should handle checker that throws an error', async ()=>{
            const checker1 = async ()=>{
                throw new Error('Access check failed');
            };
            const checker2 = async ()=>true;
            await expect(accessOR(checker1, checker2)(mockArgs)).rejects.toThrow('Access check failed');
        });
        it('should handle null or undefined returns gracefully', async ()=>{
            const checker1 = async ()=>null;
            const checker2 = async ()=>undefined;
            const checker3 = async ()=>true;
            const result = await accessOR(checker1, checker2, checker3)(mockArgs);
            expect(result).toBe(true);
        });
        it('should handle deeply nested Where queries', async ()=>{
            const checker = async ()=>({
                    and: [
                        {
                            or: [
                                {
                                    field1: {
                                        equals: 'value1'
                                    }
                                },
                                {
                                    and: [
                                        {
                                            field2: {
                                                equals: 'value2'
                                            }
                                        },
                                        {
                                            field3: {
                                                equals: 'value3'
                                            }
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            field4: {
                                not_equals: 'value4'
                            }
                        }
                    ]
                });
            const result = await accessOR(checker)(mockArgs);
            expect(result).toEqual({
                or: [
                    {
                        and: [
                            {
                                or: [
                                    {
                                        field1: {
                                            equals: 'value1'
                                        }
                                    },
                                    {
                                        and: [
                                            {
                                                field2: {
                                                    equals: 'value2'
                                                }
                                            },
                                            {
                                                field3: {
                                                    equals: 'value3'
                                                }
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                field4: {
                                    not_equals: 'value4'
                                }
                            }
                        ]
                    }
                ]
            });
        });
        it('should handle all checkers returning null/undefined', async ()=>{
            const checker1 = async ()=>null;
            const checker2 = async ()=>undefined;
            const result = await accessOR(checker1, checker2)(mockArgs);
            // null and undefined should be treated as false
            expect(result).toBe(false);
        });
        it('should handle Where query with empty object', async ()=>{
            const checker = async ()=>({});
            const result = await accessOR(checker)(mockArgs);
            expect(result).toEqual({});
        });
        it('should handle conditional with complex condition function', async ()=>{
            const condition = ({ req })=>{
                return !!(req.user && req.user.email && req.user.email.endsWith('@admin.com'));
            };
            const checker = async ()=>true;
            // Non-admin email
            const result1 = await conditional(condition, checker)({
                req: {
                    user: {
                        id: '123',
                        email: 'user@example.com'
                    },
                    headers: new Headers(),
                    payload: {},
                    context: {}
                }
            });
            expect(result1).toBe(false);
            // Admin email
            const result2 = await conditional(condition, checker)({
                req: {
                    user: {
                        id: '123',
                        email: 'admin@admin.com'
                    },
                    headers: new Headers(),
                    payload: {},
                    context: {}
                }
            });
            expect(result2).toBe(true);
        });
        it('should handle alternating true/false in or correctly', async ()=>{
            const checkers = [
                async ()=>false,
                async ()=>false,
                async ()=>false,
                async ()=>true,
                async ()=>{
                    throw new Error('Should not be called');
                }
            ];
            const result = await accessOR(...checkers)(mockArgs);
            expect(result).toBe(true);
        });
        it('should handle alternating true/false in and correctly', async ()=>{
            const checkers = [
                async ()=>true,
                async ()=>true,
                async ()=>false,
                async ()=>{
                    throw new Error('Should not be called');
                }
            ];
            const result = await accessAND(...checkers)(mockArgs);
            expect(result).toBe(false);
        });
    });
});

//# sourceMappingURL=accessComposition.spec.js.map