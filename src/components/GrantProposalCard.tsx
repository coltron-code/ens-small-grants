import { mq, Typography } from '@ensdomains/thorin';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { Grant } from '../types';
import { getTimeDifferenceString, voteCountFormatter } from '../utils';
import Profile from './Profile';
import { cardStyles } from './atoms';

export type GrantProposalCardProps = {
  roundId: string | number;
  proposal: Grant;
  inProgress?: boolean;
};

const StyledCard = styled(Link)(
  cardStyles,
  ({ theme }) => css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      'profile votes'
      'content content';
    gap: ${theme.space['4']};
    border: 1px solid ${theme.colors.borderSecondary};

    width: 100%;
    height: 100%;

    transition: all 0.15s ease-in-out;
    &:hover {
      background-color: ${theme.colors.backgroundTertiary};
    }

    ${mq.md.min(css`
      grid-template-areas: 'profile content votes';
      grid-template-columns: ${theme.space['44']} 1fr min-content;
    `)}
  `
);

const Title = styled(Typography)(
  ({ theme }) => css`
    font-size: ${theme.fontSizes.extraLarge};
    font-weight: bold;

    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  `
);

const Description = styled(Typography)(
  () => css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  `
);

const Votes = styled(Typography)(
  ({ theme }) => css`
    grid-area: votes;
    white-space: nowrap;
    color: ${theme.colors.textTertiary};
    font-size: ${theme.fontSizes.extraLarge};
    text-align: right;
    b {
      color: ${theme.colors.text};
    }
  `
);

const ProfileWrapper = styled.div(
  ({ theme }) => css`
    grid-area: profile;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;

    width: ${theme.space['44']};
    min-width: ${theme.space['44']};
    padding: ${theme.space['2']};
    border-radius: ${theme.radii.large};

    background-color: ${theme.colors.backgroundTertiary};

    div {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  `
);

const ContentWrapper = styled.div(
  () => css`
    flex-grow: 1;
    grid-area: content;
  `
);

function GrantProposalCard({ roundId, proposal }: GrantProposalCardProps) {
  const to = `/rounds/${roundId}/proposals/${proposal.id}`;

  return (
    <StyledCard to={to}>
      <ProfileWrapper>
        <Profile
          address={proposal.proposer}
          subtitle={`${getTimeDifferenceString(proposal.createdAt, new Date())} ago`}
        />
      </ProfileWrapper>
      <ContentWrapper>
        <Title>{proposal.title}</Title>
        <Description>{proposal.description}</Description>
      </ContentWrapper>
      <Votes>
        <b>{voteCountFormatter.format(proposal.voteCount!)}</b> votes
      </Votes>
    </StyledCard>
  );
}

export default GrantProposalCard;
