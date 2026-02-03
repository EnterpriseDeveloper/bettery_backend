import { NextFunction, Request, Response } from 'express';
import { checkIsTokenValid } from '../check-is-token-valid';

describe('Test checkIsTokenValid middleware', () => {
    jest.setTimeout(30000);
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            json: jest.fn()
        };
    });

    test('with not valid token', async () => {
        const expectedResponse = { "error": "not valid token" };


        const mockRequest = {
            body: {
                accessToken: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
            }
        }

        await checkIsTokenValid(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(mockResponse.json).toBeCalledWith(expectedResponse);

    });

});