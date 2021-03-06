import { get } from "../constant.js";

const organization={
    _info: "https://api.github.com/orgs/learn-opensource",
    _repos: "https://api.github.com/orgs/learn-opensource/repos",
    _members: "https://api.github.com/orgs/learn-opensource/public_members"
};


const htmlContributorCard=(contributor) => {
    const blog=contributor.blog? `<div class="mx-2"><a href="${contributor.blog}"><i title="Blog" class="fa fa-blog text-muted"></i></a></div>`:"";
    const hireable=contributor.hireable? `<div class="mx-2"><i title="Hireable" class="fa fa-user-plus text-muted"></i></div>`:"";
    return `<div class="px-4 p-2 d-inline-flex" data-aos="zoom-in" data-aos-delay="200">
                <div class="rounded border p-3">
                    <div class="d-flex align-items-center">
                        <img height="55" width="auto" src="${contributor.avatar_url}" class="avatar rounded-circle shadow-sm" />
                        <div class="text-dark d-flex flex-column align-items-center">
                            <a href="${contributor.html_url}" class="text-main">
                                <h5 class="pl-2">${contributor.login}</h5>
                            </a>
                            <div class="d-flex align-items-between mt-2">
                                <div class="mx-2">
                                    <i title="Public Repos" class="fa fa-github text-muted"></i>
                                    ${contributor.public_repos}
                                </div>
                                <div class="mx-2">
                                    <i title="Contributions" class="fa fa-code-branch text-muted"></i> 
                                    ${contributor.contributions}
                                </div>
                                ${blog}
                                ${hireable}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

};

const get_repo_contributors=async (contributors_url) => {
    const contributors=await get(contributors_url);
    return contributors;
};

const sum_contributor_contributions=async (repo, contributors) => {
    return get_repo_contributors(repo.contributors_url).then(repo_contributors => {
        contributors.push(...repo_contributors);
        return contributors;
    });
};

const get_contributor_details=async (url) => {
    const details=await get(url);
    return details;
};

const get_sort_order=(contributors) => {
    const sorted_contributors=Object.keys(contributors).sort(function (a, b) { return contributors[b].contributions-contributors[a].contributions });
    const top_contributors=sorted_contributors.slice(0, 20);
    return top_contributors;
}

const build_contributor_cards=(contributors, sort_order) => {
    const contributorsNode=document.getElementById("contributors");
    sort_order.map(contributor_login => {
        const con=contributors[contributor_login];
        const card=htmlContributorCard(con);
        contributorsNode.innerHTML+=card;
    });
};

export const get_organization_contributors=async () => {
    let all_contributors_with_dups=[];
    const repos=await get(organization._repos);

    const map_repos=repos.map(async (repo) => {
        const contributors_with_sums=await sum_contributor_contributions(repo, all_contributors_with_dups);
        all_contributors_with_dups=contributors_with_sums;
    });

    Promise.all(map_repos).then(map_repos_done => {
        const all_contributors_with_sums={};

        const map_contributors_with_dups=all_contributors_with_dups.map(contributor_dup => {
            const contributor_in_final=all_contributors_with_sums.hasOwnProperty(contributor_dup.login);
            if (contributor_in_final) {
                const old_count=all_contributors_with_sums[contributor_dup.login].contributions;
                const new_count=contributor_dup.contributions;
                const total_count=old_count+new_count;
                all_contributors_with_sums[contributor_dup.login].contributions=total_count;
            }
            else {
                all_contributors_with_sums[contributor_dup.login]=contributor_dup;
            }
            return all_contributors_with_sums;
        });

        Promise.all(map_contributors_with_dups).then(map_contributors_with_dups_done => {

            const map_contributors_add_details=Object.keys(all_contributors_with_sums).map(async (contributor_needs_details) => {
                const contributor_to_fetch=all_contributors_with_sums[contributor_needs_details];
                const contributor_details=await get_contributor_details(contributor_to_fetch.url);
                contributor_to_fetch.name=contributor_details.name;
                contributor_to_fetch.location=contributor_details.location;
                contributor_to_fetch.blog=contributor_details.blog;
                contributor_to_fetch.bio=contributor_details.bio;
                contributor_to_fetch.company=contributor_details.company;
                contributor_to_fetch.hireable=contributor_details.hireable;
                contributor_to_fetch.public_repos=contributor_details.public_repos;
                return all_contributors_with_sums;
            });

            Promise.all(map_contributors_add_details).then(map_contributors_add_details_done => {
                const sort_order=get_sort_order(all_contributors_with_sums);
                build_contributor_cards(all_contributors_with_sums, sort_order);
            });
        });
    });
};