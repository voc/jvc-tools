#!/usr/bin/env perl

use v5.12;
use strict;
use warnings;

use lib qw(./lib);

use JVC;
use Getopt::Long;

use Data::Dumper;

my $host;
my $session;

GetOptions("host|h=s" => \$host,
           "session|s=s" => \$session);

die "host needs to be given" unless $host;

my $j = JVC->new(host => $host, session => $session);

my $r = $j->get_status;
exit 1 unless $r;

sub dump_slot {
	my ($name, $slot) = @_;

	say "SD card slot ${name}:";

	my $pretty_status;
	if ($slot->{Status} =~ /Rec$/) {
		$pretty_status = "recording";
	} elsif ($slot->{Status} eq 'Invalid' or $slot->{Status} eq 'NoCard') {
		$pretty_status = "nocard";
	} else {
		$pretty_status = "idle";
	}

	say " Status: " . $pretty_status;
	say " Remaining: " . $slot->{Remain} . " min";
}

dump_slot(A => $r->{SlotA});
dump_slot(B => $r->{SlotB});
