/**
 * Realistic mock response generator for demo and sandbox environments.
 * Used when upstream live calls encounter sandbox/mock targets.
 */

export function generateMockApiResponse(
  templateId: string,
  params: Record<string, any>,
  url: string
): any {
  if (templateId === 'tpl-stripe-subs' || url.includes('/v1/subscriptions')) {
    const status = params.status || 'active';
    const limit = Number(params.limit) || 3;
    const customer = params.customer || 'cus_9921_alpha';

    return {
      object: 'list',
      data: Array.from({ length: Math.min(limit, 5) }).map((_, i) => ({
        id: `sub_1N${Math.random().toString(36).substring(2, 9)}`,
        object: 'subscription',
        status,
        customer,
        current_period_start: 1714521600,
        current_period_end: 1717200000,
        currency: 'usd',
        items: {
          object: 'list',
          data: [
            {
              id: `si_item_${i + 1}`,
              price: {
                id: 'price_enterprise_tier1',
                unit_amount: 14900,
                currency: 'usd',
                recurring: { interval: 'month' },
              },
              quantity: 1,
            },
          ],
        },
        metadata: {
          plan_name: 'Enterprise Pro',
          source: 'rea-api-playground',
        },
      })),
      has_more: false,
      total_count: limit,
    };
  }

  if (templateId === 'tpl-stripe-customer' || url.includes('/v1/customers/search')) {
    const query = params.query || 'email:test@example.com';
    const emailMatch = query.match(/[\w.-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0] : 'alice@acme.corp';

    return {
      object: 'search_result',
      data: [
        {
          id: 'cus_9921_alpha',
          object: 'customer',
          name: 'Alice Henderson',
          email,
          balance: 0,
          currency: 'usd',
          delinquent: false,
          created: 1709251200,
          default_source: 'card_1Mmock4242',
          invoice_settings: {
            default_payment_method: 'pm_card_visa_demo',
          },
          subscriptions: {
            total_count: 1,
            data: [{ id: 'sub_enterprise_active', status: 'active' }],
          },
        },
      ],
      has_more: false,
    };
  }

  if (templateId === 'tpl-stripe-invoices' || url.includes('/v1/invoices')) {
    const customer = params.customer || 'cus_9921_alpha';
    const status = params.status || 'paid';
    return {
      object: 'list',
      data: [
        {
          id: 'in_100234_demo',
          object: 'invoice',
          customer,
          customer_email: 'billing@enterprise.com',
          amount_due: 14900,
          amount_paid: 14900,
          currency: 'usd',
          status,
          hosted_invoice_url: `https://invoice.stripe.com/i/acct_mock/inv_${Date.now()}`,
          invoice_pdf: `https://pay.stripe.com/invoice/inv_mock_${Date.now()}/pdf`,
          period_start: 1714521600,
          period_end: 1717200000,
        },
      ],
      has_more: false,
    };
  }

  if (templateId === 'tpl-hubspot-contact' || url.includes('/crm/v3/objects/contacts')) {
    const contactId = params.contactId || '50192';
    return {
      id: contactId,
      properties: {
        firstname: 'Jordan',
        lastname: 'Vance',
        email: contactId.includes('@') ? contactId : 'jordan.vance@techcorp.io',
        company: 'TechCorp International',
        lifecycle_stage: 'salesqualifiedlead',
        hs_lead_status: 'OPEN_DEAL',
        phone: '+1 (555) 234-5678',
        createdate: '2025-11-14T08:12:30.410Z',
        lastmodifieddate: new Date().toISOString(),
      },
      associations: {
        companies: { results: [{ id: 'comp_8841', type: 'contact_to_company' }] },
        deals: { results: [{ id: 'deal_10091', type: 'contact_to_deal' }] },
      },
    };
  }

  if (templateId === 'tpl-hubspot-deals' || url.includes('/crm/v3/objects/deals')) {
    const stage = params.dealstage || 'contractsent';
    const limit = Number(params.limit) || 2;
    return {
      results: Array.from({ length: limit }).map((_, i) => ({
        id: `deal_${10400 + i}`,
        properties: {
          dealname: i === 0 ? 'Global Logistics SaaS Expansion' : 'Cloud Migration Phase 2',
          amount: (i + 1) * 75000,
          dealstage: stage,
          pipeline: 'default',
          closedate: '2026-11-30T00:00:00Z',
          hs_priority: 'high',
        },
        archived: false,
        createdAt: '2026-09-01T10:00:00Z',
      })),
      total: limit,
    };
  }

  if (templateId === 'tpl-internal-user' || url.includes('/api/v2/users/')) {
    const userId = params.userId || 'usr_884920';
    return {
      status: 'success',
      data: {
        userId,
        username: 'jdoe',
        email: 'john.doe@company.internal',
        fullName: 'John Doe',
        roles: ['product_manager', 'beta_tester'],
        status: 'ACTIVE',
        organizationId: 'org_acme_global',
        twoFactorEnabled: true,
        lastLoginAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        securityFlags: {
          passwordChangeRequired: false,
          suspiciousIpFlagged: false,
        },
      },
    };
  }

  if (templateId === 'tpl-internal-revoke' || url.includes('revoke-sessions')) {
    const userId = params.userId || 'usr_884920';
    return {
      status: 'success',
      timestamp: new Date().toISOString(),
      action: 'USER_SESSIONS_REVOKED',
      details: {
        userId,
        revokedTokenCount: 3,
        clearedSessions: ['session_web_chrome_mac', 'session_mobile_ios'],
        reason: params.reason || 'Manual security reset via API Playground',
      },
    };
  }

  // Generic fallback
  return {
    status: 200,
    timestamp: new Date().toISOString(),
    endpoint: url,
    executedParams: params,
    message: 'Request successfully simulated through secure backend proxy',
  };
}
