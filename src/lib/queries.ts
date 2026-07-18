'use server';

import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { db } from '../../prisma/db';
import { redirect } from 'next/navigation';
import { User } from '@prisma/client';

export const getAuthUserDetails = async () => {
  const user = await currentUser();
  if (!user) return;

  const userDate = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: {
      agency: {
        include: {
          sidebarOptions: true,
          subAccounts: { include: { sidebarOptions: true } },
        },
      },
      permissions: true,
    },
  });
  return userDate;
};

export const saveActivityLogsNotification = async ({
  agencyId,
  description,
  subAccountId,
}: {
  agencyId: string | undefined;
  description: string;
  subAccountId: string | undefined;
}) => {
  const authUser = await currentUser();
  let userDate;
  if (!authUser) {
    const response = await db.user.findFirst({
      where: {
        agency: {
          subAccounts: {
            some: { id: subAccountId },
          },
        },
      },
    });

    if (response) {
      userDate = response;
    }
  } else {
    userDate = await db.user.findFirst({
      where: {
        email: authUser.emailAddresses[0].emailAddress,
      },
    });
  }
  if (!userDate) {
    console.log('could not find a user');
    return;
  }

  let foundAgencyId = agencyId;
  if (!foundAgencyId) {
    if (!subAccountId) {
      throw new Error('You need to provide ar least an agency ID or subaccount Id');
    }
    const response = await db.subAccount.findUnique({
      where: {
        id: subAccountId,
      },
    });
    if (response) foundAgencyId = response.agencyId;
  }
  if (subAccountId) {
    await db.notification.create({
      data: {
        notification: `${userDate.name} | ${description}`,
        user: {
          connect: {
            id: userDate.id,
          },
        },
        agency: {
          connect: {
            id: foundAgencyId,
          },
        },
        subAccount: {
          connect: { id: subAccountId },
        },
      },
    });
  } else {
    await db.notification.create({
      data: {
        notification: `${userDate.name} | ${description}`,
        user: {
          connect: {
            id: userDate.id,
          },
        },
        agency: {
          connect: {
            id: foundAgencyId,
          },
        },
      },
    });
  }
};
export const createTeamUser = async (agencyId: string, user: User) => {
  if (user.role === 'AGENCY_OWNER') return null;
  const response = await db.user.create({ data: { ...user } });
  return response;
};

export const verifyAndAcceptInvitation = async () => {
  const user = await currentUser();

  if (!user) return redirect('/sign-in');

  const invitationExists = await db.invitation.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress,
      status: 'PENDING',
    },
  });

  console.log(invitationExists ? 'OKAAA' : 'NOOOT');
  if (invitationExists) {
    const userDetails = await createTeamUser(invitationExists.agencyId, {
      email: invitationExists.email,
      agencyId: invitationExists.agencyId,
      avatarUrl: user.imageUrl,
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: invitationExists.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await saveActivityLogsNotification({
      agencyId: invitationExists?.agencyId,
      description: 'Joined',
      subAccountId: undefined,
    });

    if (userDetails) {
      const client = await clerkClient();
      await client.users.updateUserMetadata(user.id, {
        privateMetadata: {
          role: userDetails.role || 'SUBACCOUNT_USER',
        },
      });
      await db.invitation.delete({
        where: {
          email: userDetails.email,
        },
      });
      return userDetails.agencyId;
    } else {
      return null;
    }
  } else {
    const agency = await db.user.findUnique({
      where: {
        email: user.emailAddresses[0].emailAddress,
      },
    });
    return agency ? agency.agencyId : null;
  }
};
