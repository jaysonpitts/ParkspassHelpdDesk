import { db } from './db';
import { users, categories, articles, tickets, ticketMessages, macros } from '@shared/schema';
import { storeArticleEmbedding } from './ai';

// Seed data for the Parkspass Help Desk
export async function seedDatabase() {
  console.log('Seeding database...');
  
  try {
    // Check if database is already seeded
    const [existingUser] = await db.select().from(users).limit(1);
    if (existingUser) {
      console.log('Database already seeded. Skipping...');
      return;
    }
    
    // Seed users
    console.log('Seeding users...');
    const [adminUser] = await db.insert(users).values({
      email: 'admin@parkspass.com',
      name: 'Admin User',
      role: 'agent',
      clerkId: 'admin_clerk_id',
    }).returning();
    
    const [agentUser] = await db.insert(users).values({
      email: 'agent@parkspass.com',
      name: 'Support Agent',
      role: 'agent',
      clerkId: 'agent_clerk_id',
    }).returning();
    
    const [visitorUser] = await db.insert(users).values({
      email: 'visitor@example.com',
      name: 'Sample Visitor',
      role: 'visitor',
      clerkId: 'visitor_clerk_id',
    }).returning();
    
    // Seed categories
    console.log('Seeding categories...');
    const categoryData = [
      {
        name: 'Reservations & Tickets',
        description: 'How to book, modify, or cancel your park visits',
        icon: 'ticket-alt',
      },
      {
        name: 'Camping & Amenities',
        description: 'Information about campsites, facilities, and park amenities',
        icon: 'campground',
      },
      {
        name: 'Billing & Payments',
        description: 'Managing your payments, refunds, and annual passes',
        icon: 'credit-card',
      },
      {
        name: 'Park Information',
        description: 'Details about specific parks, trails, and activities',
        icon: 'tree',
      },
      {
        name: 'Technical Support',
        description: 'Help with website and app issues',
        icon: 'laptop',
      },
    ];
    
    const seededCategories = [];
    for (const category of categoryData) {
      const [insertedCategory] = await db.insert(categories).values(category).returning();
      seededCategories.push(insertedCategory);
    }
    
    // Seed articles
    console.log('Seeding articles...');
    const articleData = [
      {
        title: 'How to Reserve a Campsite During Peak Season',
        content: `
# How to Reserve a Campsite During Peak Season

Peak season at Utah State Parks (May through September) is extremely popular, with campsites often booking months in advance. Follow these steps to secure your spot:

## Booking Timeline

- **6 months in advance**: Most campgrounds open reservations exactly 6 months before your arrival date
- **9:00 AM Mountain Time**: New reservation slots open at this specific time
- **Holiday weekends**: Expect these to fill within minutes of opening

## Reservation Steps

1. Create a Parkspass account before the reservation window opens
2. Save your payment information to speed up checkout
3. Have multiple date options ready in case your first choice is unavailable
4. Log in 15 minutes before the reservation window opens
5. Refresh the page right at 9:00 AM MT
6. Complete your booking as quickly as possible

## Reservation Tips

- Book weekdays instead of weekends for better availability
- Consider "shoulder seasons" (April-May or September-October)
- Enable email notifications for cancellations
- Look for first-come, first-served campgrounds as alternatives

## Modifying Reservations

You can modify existing reservations up to 72 hours before check-in without penalty. After that, changes are subject to a $15 modification fee.

For assistance with reservations, contact the Parkspass support team at support@parkspass.com or call (800) 555-PARK.
        `,
        authorId: adminUser.id,
        categoryId: seededCategories[0].id,
        isPublished: true,
      },
      {
        title: 'Understanding Trail Difficulty Ratings',
        content: `
# Understanding Trail Difficulty Ratings

Utah State Parks uses a standardized rating system to help visitors choose trails that match their ability level. Here's a guide to understanding these ratings:

## Rating Scale

### Easy (Green Circle)
- **Terrain**: Relatively flat, well-maintained surface
- **Distance**: Typically under 2 miles round trip
- **Elevation Gain**: Minimal (under 200 feet)
- **Technical Difficulty**: None, suitable for all ages and fitness levels
- **Example**: Lakeside Trail at Bear Lake State Park

### Moderate (Blue Square)
- **Terrain**: Some uneven surfaces, occasional obstacles
- **Distance**: Usually 2-5 miles round trip
- **Elevation Gain**: Moderate (200-700 feet)
- **Technical Difficulty**: Some rocky sections or moderate inclines
- **Example**: East Rim Trail at Dead Horse Point State Park

### Difficult (Black Diamond)
- **Terrain**: Challenging, varied surfaces with obstacles
- **Distance**: Often 5+ miles round trip
- **Elevation Gain**: Significant (700+ feet)
- **Technical Difficulty**: Steep sections, navigation challenges, possible exposure
- **Example**: Whiterocks Amphitheater Trail at Snow Canyon State Park

### Expert (Double Black Diamond)
- **Terrain**: Very challenging, potentially hazardous conditions
- **Distance**: Varies, but often lengthy
- **Elevation Gain**: Substantial
- **Technical Difficulty**: Requires experience, skills, and proper equipment
- **Example**: Slot canyons at Goblin Valley State Park

## Additional Trail Indicators

- **Family-Friendly**: Suitable for children, typically easy trails
- **ADA Accessible**: Meets accessibility standards
- **Seasonal**: May be closed or dangerous during certain times of year
- **Water Required**: Limited or no water sources on trail

## Trail Safety Tips

1. Always check current trail conditions before starting
2. Carry adequate water (minimum 1 liter per 2 hours of hiking)
3. Inform someone of your hiking plans and expected return time
4. Wear appropriate footwear and clothing for the conditions
5. Carry the Ten Essentials for hiking safety

Remember that trail conditions can change due to weather, maintenance status, and seasonal factors. Always check with park rangers for the most current information.
        `,
        authorId: adminUser.id,
        categoryId: seededCategories[3].id,
        isPublished: true,
      },
      {
        title: 'Annual Pass Benefits and Options',
        content: `
# Annual Pass Benefits and Options

Utah State Parks offers several annual pass options to provide frequent visitors with cost savings and convenience.

## Pass Options

### Standard Annual Pass
- **Cost**: $100
- **Coverage**: Covers day-use entry fees for one vehicle
- **Validity**: 12 months from date of purchase
- **Transferability**: Can be used with any vehicle when the pass holder is present

### Premium Annual Pass
- **Cost**: $175
- **Coverage**: Includes day-use entry fees plus 20% discount on camping reservations
- **Validity**: 12 months from date of purchase
- **Transferability**: Same as Standard Pass
- **Additional Benefits**: Early access to reservation windows (7 months vs 6)

### Senior Annual Pass
- **Cost**: $50
- **Eligibility**: Utah residents age 65 and older
- **Coverage**: Same as Standard Pass
- **Validity**: 12 months from date of purchase

### Military/Veteran Pass
- **Cost**: $50
- **Eligibility**: Active duty military, veterans, and reserves with valid ID
- **Coverage**: Same as Standard Pass
- **Validity**: 12 months from date of purchase

## What's Covered

Annual passes cover day-use entry fees only and do not include:
- Camping fees
- Special events
- Boat launch fees
- OHV trail access fees
- Equipment rentals

## Purchasing Options

Annual passes can be purchased:
- Online through the Parkspass website
- At any Utah State Park entrance station
- By calling the reservation center at (800) 555-PARK
- At Utah Division of Natural Resources offices

## Using Your Pass

1. Display your pass visibly on your vehicle's dashboard or rearview mirror
2. Bring photo ID matching the name on the pass
3. Pass is valid for one vehicle only when entering parks

For questions about annual passes or to report a lost or stolen pass, contact customer support at support@parkspass.com.
        `,
        authorId: agentUser.id,
        categoryId: seededCategories[2].id,
        isPublished: true,
      },
      {
        title: 'How to Change or Cancel a Reservation',
        content: `
# How to Change or Cancel a Reservation

Life happens, and sometimes plans need to change. Here's how to modify or cancel your Parkspass reservation.

## Modification Policy

You can modify your reservation, subject to the following conditions:

### Changes Allowed
- Dates (subject to availability)
- Number of nights
- Site number or type
- Number of vehicles
- Number of occupants

### Modification Fees
- **More than 72 hours before arrival**: No fee
- **Within 72 hours of arrival**: $15 modification fee
- **After check-in time on arrival date**: No changes allowed

## Cancellation Policy

If you need to cancel your reservation entirely:

### Refund Schedule
- **14+ days before arrival**: Full refund minus $10 processing fee
- **7-13 days before arrival**: 80% refund
- **3-6 days before arrival**: 50% refund
- **0-2 days before arrival**: No refund

## How to Modify or Cancel

### Online Method
1. Log in to your Parkspass account
2. Navigate to "My Reservations"
3. Select the reservation you wish to change
4. Click "Modify Reservation" or "Cancel Reservation"
5. Follow the prompts to complete your request

### Phone Method
1. Call (800) 555-PARK during business hours
2. Provide your reservation number and verification details
3. Specify the changes needed or request cancellation

### Email Method
1. Email changes@parkspass.com
2. Include your reservation number and requested changes
3. Allow 24-48 hours for processing

## Important Notes

- Reservation modifications are subject to availability
- Price differences apply if changing to a more expensive site or date
- No refunds are issued for price differences when changing to a less expensive option
- Annual pass discounts cannot be applied after the initial booking

If you have special circumstances requiring exceptions to these policies, please contact customer support.
        `,
        authorId: agentUser.id,
        categoryId: seededCategories[0].id,
        isPublished: true,
      },
      {
        title: 'Troubleshooting Payment Issues',
        content: `
# Troubleshooting Payment Issues

If you're experiencing problems with payments on the Parkspass system, this guide will help you resolve the most common issues.

## Common Payment Problems

### Payment Declined
If your credit card is being declined, check:
1. Card expiration date and CVV code for accuracy
2. Available credit/funds in the account
3. Whether your bank is blocking the transaction as suspicious

**Solution**: Try a different payment method or contact your bank to authorize the transaction.

### Payment Processed But No Confirmation
If you were charged but didn't receive a confirmation:
1. Check your spam/junk email folders
2. Look under "My Reservations" in your account
3. Check if multiple charges occurred due to multiple submission attempts

**Solution**: Contact support with the approximate time of payment and the last four digits of your card.

### Incorrect Amount Charged
If you were charged a different amount than expected:
1. Verify that all fees and taxes were accounted for in your estimate
2. Check if additional vehicles or premium sites affected the price
3. Confirm whether any discounts or promotions were properly applied

**Solution**: Compare your receipt with the fee schedule and contact support with specific discrepancies.

## Technical Issues

### Browser Problems
1. Clear your browser cache and cookies
2. Try a different browser
3. Disable browser extensions that might interfere with payment processing

### Mobile App Issues
1. Ensure you're using the latest version of the app
2. Try restarting the app or your device
3. Check your internet connection stability

## Refund Requests

If you need to request a refund for an incorrect charge:
1. Email billing@parkspass.com with your order number
2. Include the date of transaction and amount
3. Explain the circumstances requiring a refund
4. Allow 5-7 business days for review and processing

## Contacting Payment Support

For urgent payment issues:
- Call: (800) 555-PARK, option 2
- Email: billing@parkspass.com
- Live chat: Available 9 AM - 5 PM MT weekdays

Please have your order number and payment details ready when contacting support.
        `,
        authorId: adminUser.id,
        categoryId: seededCategories[2].id,
        isPublished: true,
      },
    ];
    
    console.log('Creating articles and embeddings...');
    for (const article of articleData) {
      const [insertedArticle] = await db.insert(articles).values(article).returning();
      
      // Generate and store embedding for the article
      await storeArticleEmbedding(insertedArticle.id, `${insertedArticle.title} ${insertedArticle.content}`);
    }
    
    // Seed tickets
    console.log('Seeding tickets...');
    const [ticket1] = await db.insert(tickets).values({
      subject: 'Reservation not showing in my account',
      description: 'I made a reservation yesterday for Dead Horse Point State Park, but it\'s not showing up in my account. The payment was processed on my credit card.',
      status: 'pending',
      priority: 'high',
      requesterId: visitorUser.id,
      assigneeId: agentUser.id,
      orderNumber: 'ORD-1234567',
    }).returning();
    
    const [ticket2] = await db.insert(tickets).values({
      subject: 'Campsite amenities inquiry',
      description: 'I\'m planning a trip to Goblin Valley State Park and wanted to know if the campsites have electrical hookups and what the shower facilities are like.',
      status: 'open',
      priority: 'normal',
      requesterId: visitorUser.id,
    }).returning();
    
    // Seed ticket messages
    console.log('Seeding ticket messages...');
    await db.insert(ticketMessages).values([
      {
        ticketId: ticket1.id,
        authorId: visitorUser.id,
        content: 'I made a reservation yesterday for Dead Horse Point State Park, but it\'s not showing up in my account. The payment was processed on my credit card.',
      },
      {
        ticketId: ticket1.id,
        authorId: agentUser.id,
        content: 'Thank you for contacting Parkspass support. I\'m sorry to hear about the issue with your reservation. I can see that the payment was processed successfully, but there appears to be a delay in syncing with our reservation system. I\'ve manually added the reservation to your account now. You should be able to see it if you refresh your reservations page. Please let me know if you have any other questions!',
      },
      {
        ticketId: ticket2.id,
        authorId: visitorUser.id,
        content: 'I\'m planning a trip to Goblin Valley State Park and wanted to know if the campsites have electrical hookups and what the shower facilities are like.',
      },
    ]);
    
    // Seed macros
    console.log('Seeding macros...');
    await db.insert(macros).values([
      {
        title: 'Reservation Confirmation',
        content: 'Thank you for your reservation at {{park_name}}. Your reservation is confirmed for {{check_in_date}} to {{check_out_date}}. If you need to make any changes, please visit your account or contact us at least 72 hours before your arrival. We look forward to your visit!',
        createdById: adminUser.id,
      },
      {
        title: 'Technical Issue Response',
        content: 'I apologize for the technical difficulty you\'re experiencing. Our team is looking into this issue now. In the meantime, you can try clearing your browser cache and cookies, or using a different browser. If the problem persists, please let us know and we\'ll continue working on a solution for you.',
        createdById: adminUser.id,
      },
      {
        title: 'Refund Request Acknowledgment',
        content: 'We\'ve received your refund request for {{order_number}}. Our billing team will review this request within 3-5 business days. If approved, please allow an additional 5-7 business days for the refund to appear on your original payment method. We\'ll notify you once the refund has been processed.',
        createdById: adminUser.id,
      },
    ]);
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
