import { expect } from 'chai';
import server from './index';
import Handler from '../server/modules/handlerDeligator';


describe('Stub tests', () => {

    before(() => {
        console.log('before');
        // server.start();
    });

    after(async () => {
        console.log('after');
    });

    describe('server', () => {
        it('getClientNum always returns 5', async () => {
            const handler = new Handler();
            handler.getUserAccountData('s','ds');
            
            // expect(res).to.be.equal(5);

            // const res =  server.getClientNum();
            // expect(res).to.be.equal(5);
        });
    });

});