import { getAuthUserDetails, verifyAndAcceptInvitation } from '@/lib/queries';

const Page = async () => {
  // the user send invitation?
  const agencyId = await verifyAndAcceptInvitation();
  console.log('agencyIdxxxxxxxxxxxxxxxx', agencyId);
  //get user details
  // check what access
  // subacount ? agency accoutn?
  const user = await getAuthUserDetails();

  return <div>Agency</div>;
};

export default Page;
