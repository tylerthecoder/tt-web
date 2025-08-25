import { ListView } from '@/components/list-view';
import NotesListByTag from '@/components/notes-list-by-tag';
import { UntrackedGoogleDocCardLoader } from '@/components/untrack-google-doc-card-loader';

export default function MenteesPage() {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-semibold mb-4 text-white text-center">Redwood</h1>
      <ListView listId="68aa840cd3cabb442c62ac05" showTitle={false} />
      <hr className="my-4" />

      <h1 className="text-xl font-semibold mb-4 text-white text-center">Main Docs</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <UntrackedGoogleDocCardLoader docId="1sN8vn9KA3EqQBvrH8PioqV9t-WjOpOrYVDjyPQ93R5s" />
        <UntrackedGoogleDocCardLoader docId="1Be3Ijy2sKRbffsamRGhtDczjlsHWTU-b6yK-SxgPEwc" />
      </div>

      <hr className="my-4" />

      <h1 className="text-xl font-semibold mb-4 text-white text-center">Mentees</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <UntrackedGoogleDocCardLoader docId="10_s3Xm64MRq7cCihuVcxvrbI_rD1eSMY-7osYcJhmSE" />
        <UntrackedGoogleDocCardLoader docId="1-LrScygxXRlAns8gEzcuG2uaYWaDuAb_djwSRqCYyAQ" />
        <UntrackedGoogleDocCardLoader docId="1_Zxn6-7mE0hl70aoUeaxyCihuX1yX0VwvpTtyut9uNA" />
        <UntrackedGoogleDocCardLoader docId="1sc0o6Hrqi4AvJYjN64u3hIVMncrco05L_jrrujimrIQ" />
      </div>

      <hr className="my-6" />

      <NotesListByTag tag="redwood" title="Notes with tag: redwood" />
    </div>
  );
}
