import type { User } from '../App';

const planPrices: Record<User['plan'], number> = {
    'Teste Grátis': 0,
    'Starter': 99.00,
    'Pro': 299.00,
    'Expert': 599.00,
    'Trader': 1100.00,
    'Enterprise': 2999.00,
};

export const getPlanPrice = (plan: User['plan'] | null): number => {
    if (!plan) return 0;
    return planPrices[plan] || 0;
};

// --- API SIMULATIONS ---

export const createCreditCardPayment = async (cardDetails: any, userDetails: any, plan: any) => {
    console.log("Simulating Asaas Credit Card Payment...");
    console.log("Card Details:", { ...cardDetails, number: '**** **** **** ****', cvv: '***' });
    console.log("User Details:", userDetails);
    console.log("Plan:", plan);

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

    // Simulate potential validation error
    if (cardDetails.number.includes('4111')) {
        throw new Error("Pagamento recusado pela operadora do cartão.");
    }
    
    console.log("Payment successful!");
    return {
        status: 'CONFIRMED',
        id: `pay_cc_${Math.random().toString(36).substring(2, 15)}`,
    };
};

export const createPixPayment = async (userDetails: any, plan: any) => {
    console.log("Simulating Asaas PIX Payment Request...");
    console.log("User Details:", userDetails);
    console.log("Plan:", plan);
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    console.log("PIX QR Code generated!");
    return {
        status: 'PENDING',
        id: `pay_pix_${Math.random().toString(36).substring(2, 15)}`,
        qrCode: 'iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQMAAACXljzdAAAABlBMVEX///8AAABVwtN+AAABaklEQVR42uyasW3EIBAEUf//6e4iCb2QJp3AALQfe72vN2L8tq+h3gL1FqhfBvUPqLdA/QW6B+ovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/BeovUP8F6i9Q/wXqL1D/Bf4P1F+g/gP1F6h/BvW/qNe/AHE/wzQo6fWBAAAAAElFTkSuQmCC', // Fake QR code image data
        payload: '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000520400005303986540599.005802BR5913USUARIO ASAAS6009SAO PAULO62070503***6304E2D5',
    };
};

export const createBoletoPayment = async (userDetails: any, plan: any) => {
    console.log("Simulating Asaas Boleto Generation...");
    console.log("User Details:", userDetails);
    console.log("Plan:", plan);

    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    console.log("Boleto generated!");
    return {
        status: 'PENDING',
        id: `pay_bol_${Math.random().toString(36).substring(2, 15)}`,
        bankSlipUrl: `https://sandbox.asaas.com/b/${Math.random().toString(36).substring(2, 18)}`,
    };
};
