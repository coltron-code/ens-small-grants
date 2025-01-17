import { Button, Dialog, FieldSet, Helper, Input, mq, Spinner, Textarea, Typography } from '@ensdomains/thorin';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useAccount } from 'wagmi';

import BackButton from '../components/BackButton';
import DisplayItem from '../components/DisplayItem';
import { Card, InnerModal, DisplayItems } from '../components/atoms';
import { useCreateGrant, useRounds } from '../hooks';

type FormInput = {
  title: string;
  shortDescription: string;
  fullText: string;
};

const Container = styled(Card)(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;

    gap: ${theme.space['4']};
    border-radius: ${theme.radii['3xLarge']};

    width: 100%;
    height: 100%;

    a {
      color: ${theme.colors.indigo};
      font-weight: bold;
    }

    fieldset legend {
      margin-top: ${theme.space['2']};
    }
  `
);

const ButtonContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: ${theme.space['2']};
  `
);

const Title = styled(Typography)(
  ({ theme }) => css`
    font-size: ${theme.fontSizes.headingThree};
    color: ${theme.colors.textTertiary};
    text-align: right;
    flex-grow: 1;
    width: 100%;

    b {
      color: ${theme.colors.text};
      font-weight: bold;
      display: block;
    }

    ${mq.md.min(css`
      font-size: ${theme.space['9']};
      text-align: left;
      b {
        display: inline-block;
      }
    `)}
  `
);

const InputDescription = styled.div(
  ({ theme }) => css`
    font-weight: ${theme.fontWeights.medium};
    color: ${theme.colors.textTertiary};
  `
);

const DialogDescription = styled(Typography)(
  ({ theme }) => css`
    color: ${theme.colors.textSecondary};
    font-size: ${theme.fontSizes.large};
    max-width: ${theme.space['96']};
    text-align: center;
  `
);

export function CreateProposal() {
  const { roundId } = useParams<{ roundId: string }>();
  const to = `/rounds/${roundId}`;

  const { round, isLoading } = useRounds(roundId!);
  const { handleSubmit, register, getFieldState, formState } = useForm<FormInput>({
    mode: 'onBlur',
  });
  const { address } = useAccount();
  const { createGrant } = useCreateGrant();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState({
    title: '',
    shortDescription: '',
    fullText: '',
  });

  const isFormDisabled = !address;

  const onSubmit: SubmitHandler<FormInput> = useCallback(data => {
    setDialogOpen(true);
    setDialogData(data);
  }, []);

  const {
    mutate: handlePublish,
    isLoading: mutationLoading,
    error,
  } = useMutation(
    async () => {
      await createGrant({
        roundId: Number.parseInt(roundId!),
        title: dialogData.title,
        description: dialogData.shortDescription,
        fullText: dialogData.fullText,
      });

      navigate(to, { state: { submission: true } });
    },
    {
      mutationKey: ['createGrant', roundId, dialogData],
    }
  );
  const publishError = (error as Error | undefined)?.message;

  const onCancel = useCallback(() => {
    navigate(to);
  }, [navigate, to]);

  if (isLoading) {
    return <Spinner />;
  }

  if (!round) {
    return <Navigate to="/" />;
  }

  return (
    <>
      <Dialog open={dialogOpen} onDismiss={() => setDialogOpen(false)} variant="blank">
        <Dialog.Heading title="Confirm your proposal" />
        {publishError && <Helper type="error">{publishError}</Helper>}
        <InnerModal>
          <DialogDescription>
            Make sure everything is correct, proposal submissions are public and can't be undone.
          </DialogDescription>
          <DisplayItems>
            <DisplayItem label="Title" value={dialogData.title} />
            <DisplayItem label="TL;DR" value={dialogData.shortDescription} />
            <DisplayItem label="Description" value={`${dialogData.fullText.slice(0, 30).trim()}...`} />
          </DisplayItems>
        </InnerModal>
        <Dialog.Footer
          leading={
            <Button variant="secondary" onClick={() => setDialogOpen(false)} shadowless>
              Cancel
            </Button>
          }
          trailing={
            <Button shadowless disabled={mutationLoading} onClick={() => handlePublish()}>
              Publish
            </Button>
          }
        />
      </Dialog>
      <BackButton
        to={`/rounds/${roundId}`}
        title={
          <Title>
            <b>{round.title}</b> Round {round.round}
          </Title>
        }
      />
      <Container>
        {isFormDisabled && (
          <Helper alignment="horizontal" type="warning">
            You must connect your wallet to submit a proposal.
          </Helper>
        )}
        <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
          <FieldSet legend="Submit a Proposal" disabled={isFormDisabled}>
            <Input
              label="Title"
              showDot
              id="title"
              description={<InputDescription>The title of your proposal</InputDescription>}
              validated={getFieldState('title', formState).isDirty}
              required
              placeholder="ENS Spaceship"
              {...register('title', { required: true })}
            />
            <Input
              label="TL;DR"
              showDot
              id="shortDescription"
              required
              description={<InputDescription>A short, succinct summary of your proposal</InputDescription>}
              placeholder="Taking ENS users to Mars and back, literally!"
              validated={getFieldState('shortDescription', formState).isDirty}
              {...register('shortDescription', { required: true })}
            />
            <Textarea
              label="Description"
              id="fullText"
              required
              showDot
              placeholder={`## Why ENS needs a Spaceship\n\nWe need a spaceship to...`}
              description={
                <InputDescription>
                  This should be a full description of what you are proposing, with a minimum of at least 300
                  characters. You can use{' '}
                  <a href="https://www.markdownguide.org/cheat-sheet/">markdown for formatting</a> (extended syntax is
                  supported).
                </InputDescription>
              }
              validated={getFieldState('fullText', formState).isDirty}
              {...register('fullText', {
                required: true,
                validate: value => (value.length >= 300 ? undefined : 'Please enter at least 300 characters'),
              })}
              error={getFieldState('fullText', formState).error?.message}
            />
            <ButtonContainer>
              <Button onClick={onCancel} disabled={isFormDisabled} variant="secondary" shadowless>
                Cancel
              </Button>
              <Button type="submit" disabled={isFormDisabled || !formState.isValid} shadowless>
                Publish
              </Button>
            </ButtonContainer>
          </FieldSet>
        </form>
      </Container>
      <div style={{ flexGrow: 1 }} />
    </>
  );
}
