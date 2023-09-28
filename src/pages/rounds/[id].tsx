import { client } from '@/supabase';
import { Helper, mq, Typography } from '@ensdomains/thorin';
import { GetServerSidePropsContext, GetStaticPropsContext } from 'next';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import styled, { css } from 'styled-components';

import { BackButtonWithSpacing } from '../../components/BackButton';
import { BannerContainer } from '../../components/BannerContainer';
import GrantRoundSection from '../../components/GrantRoundSection';
import OpenGraphElements from '../../components/OpenGraphElements';
import { useRounds } from '../../hooks';
import type { Round, RoundInDatabase, Round as RoundType } from '../../types';
import { camelCaseRound, formatFundingPerWinner, getTimeDifferenceString } from '../../utils';

const Container = styled.div(
  ({ scholarship }: { scholarship?: boolean }) => css`
    width: 100%;
    max-width: ${scholarship ? '65rem' : '100%'};
  `
);

const HeadingContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: ${theme.space['4']};
    width: 100%;
    margin-top: ${theme.space['4']};

    ${mq.md.min(css`
      gap: ${theme.space['8']};
      flex-direction: row;
      height: max-content;
    `)}
  `
);

const Title = styled(Typography)(
  ({ theme }) => css`
    font-size: ${theme.fontSizes.headingTwo};
    color: ${theme.colors.textTertiary};
    flex-grow: 1;

    b {
      color: ${theme.colors.text};
      font-weight: bold;
    }

    ${mq.md.min(css`
      font-size: ${theme.space['9']};
    `)}
  `
);

const VoteDetailsContainer = styled.div(
  ({ theme }) => css`
    width: 100%;

    display: flex;
    gap: ${theme.space['4']};
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;

    ${mq.md.min(css`
      gap: 0;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      margin-bottom: 0;
      width: max-content;
    `)}
  `
);

const VotesTypography = styled(Typography)(
  ({ theme }) => css`
    font-size: ${theme.fontSizes.base};
    color: ${theme.colors.textTertiary};

    b {
      color: ${theme.colors.indigo};
    }

    ${mq.md.min(css`
      font-size: ${theme.fontSizes.large};
    `)}
  `
);

const VoteTimeTypography = styled(Typography)(
  ({ theme }) => css`
    font-size: ${theme.fontSizes.base};
    color: ${theme.colors.red};
    font-weight: bold;
    text-align: right;

    ${mq.md.min(css`
      font-size: ${theme.fontSizes.extraLarge};
      br {
        display: none;
      }
    `)}
  `
);

const RoundDescription = styled(Typography)(
  ({ theme }) => css`
    grid-area: content;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    width: 100%;
    max-width: 80ch;
    color: ${theme.colors.textSecondary};

    gap: ${theme.space['4']};
    margin-top: ${theme.space['8']};

    a {
      color: ${theme.colors.indigo};
    }

    ${mq.md.max(css`
      margin-bottom: ${theme.space['4']};
    `)}
  `
);

export default function Round({ staticRound }: { staticRound: Round }) {
  const router = useRouter();
  const { success } = router.query;
  const id = staticRound.id;

  if (!id) {
    router.push('/rounds');
  }

  const { round } = useRounds(id.toString());
  const showHelper = success !== undefined || false;

  return (
    <>
      <OpenGraphElements title={`${staticRound.title || ''} | ENS Small Grants`} />

      <RoundContent round={round || staticRound} id={staticRound.id.toString()} showHelper={showHelper} />
    </>
  );
}

const RoundContent = ({ round, id, showHelper }: { round: RoundType; id: string; showHelper: boolean }) => {
  const to = `/create?round=${id}`;
  const isActiveRound = round.proposalStart < new Date() && round.votingEnd > new Date();
  const isVotingRound = round.votingStart < new Date() && round.votingEnd > new Date();
  const isPropRound = round.proposalStart < new Date() && round.proposalEnd > new Date();

  let upperVoteMsg: React.ReactNode;
  let lowerVoteMsg: React.ReactNode;
  let noSnapshotWhenNeeded = false;

  if (isActiveRound && !isPropRound && !isVotingRound) {
    // Time between submissions closed and voting starts
    // upperVoteMsg = <p>Voting starts in {getTimeDifferenceString(new Date(), round.votingStart)}</p>;
    upperVoteMsg = <p>Voting starts soon</p>;
    lowerVoteMsg = <p>Submissions closed</p>;
  } else {
    const fundingPerWinnerStr = formatFundingPerWinner(round);

    upperVoteMsg = (
      <>
        <b>{fundingPerWinnerStr}</b>
        {/* <b>
          {round.maxWinnerCount} {round.scholarship ? 'people' : 'projects'}
        </b> */}
      </>
    );

    if (!round.snapshot && (!isActiveRound || isVotingRound)) {
      noSnapshotWhenNeeded = true;
      lowerVoteMsg = <>Close time unknown</>;
    } else if (!isActiveRound) {
      lowerVoteMsg = (
        <span title={round.votingEnd.toLocaleString()}>
          Voting closed {getTimeDifferenceString(round.votingEnd, new Date())} ago
        </span>
      );
    } else {
      lowerVoteMsg = isVotingRound ? (
        <span title={round.votingEnd.toLocaleString()}>
          Voting closes in <br />
          {getTimeDifferenceString(new Date(), round.votingEnd)}
        </span>
      ) : (
        <span title={round.proposalEnd.toLocaleString()}>
          Submissions close in {getTimeDifferenceString(new Date(), round.proposalEnd)}
        </span>
      );
    }
  }

  return (
    <>
      <Container scholarship={round.scholarship}>
        <BackButtonWithSpacing href="/" />
        {showHelper && (
          <Helper
            type="info"
            style={{
              marginTop: '1rem',
            }}
          >
            Proposal submission recieved!
          </Helper>
        )}

        <HeadingContainer>
          <Title>
            <b>{round.title}</b> {!round.scholarship && `Round ${round.round}`}
          </Title>
          <VoteDetailsContainer>
            <VotesTypography>{upperVoteMsg}</VotesTypography>
            <VoteTimeTypography>{lowerVoteMsg}</VoteTimeTypography>
          </VoteDetailsContainer>
        </HeadingContainer>
        {round.description && (
          <RoundDescription>
            <ReactMarkdown
              components={{
                p: ({ children }) => <Typography as="p">{children}</Typography>,
                a: ({ children, href: mdHref }) => (
                  <a href={mdHref} target="_blank" rel="noreferrer">
                    {children}
                  </a>
                ),
              }}
            >
              {round.description}
            </ReactMarkdown>
          </RoundDescription>
        )}
      </Container>

      <Container scholarship={round.scholarship}>
        {noSnapshotWhenNeeded ? (
          <BannerContainer>
            <Typography>Looks like something went wrong, try again later.</Typography>
          </BannerContainer>
        ) : (
          <GrantRoundSection
            round={round}
            createProposalHref={to}
            // createProposalClick={onClick as unknown as ClickHandler | (() => void)}
          />
        )}
      </Container>

      <div style={{ flexGrow: 1 }} />
    </>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { res, params } = context;
  const { id } = params as { id: string | undefined };

  if (!id) {
    throw new Error('No id provided');
  }

  const round = await client.from('rounds').select().eq('id', id);

  if (round.error) {
    throw round.error;
  }

  const roundData = round.data[0] as RoundInDatabase;
  const flattenedRound = camelCaseRound(roundData);

  // Cache the server rendered page for 1 min then use stale-while-revalidate for 1 hour
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=3600');

  return {
    props: {
      staticRound: flattenedRound,
    },
  };
}